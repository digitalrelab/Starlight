import type { Mount, Project, ProjectId, ReferenceMatch, SourceId } from "@starlight/contracts";
import { Context, Effect, Layer } from "effect";
import { ChatStore } from "./ports.ts";
import { Projects } from "./projects.ts";

const ENTRY_LIMIT = 12;
const CHAT_LIMIT = 6;

interface Owner {
  readonly mount: Mount;
  readonly project: ProjectId;
}

const ownersBySource = (projects: ReadonlyArray<Project>) =>
  Map.groupBy(
    projects.flatMap(({ id, mounts }) => mounts.map((mount): Owner => ({ mount, project: id }))),
    ({ mount }) => mount.root.source,
  );

const rootsOf = ({ id, name, mounts }: Project) =>
  mounts.map((mount): ReferenceMatch => ({
    _tag: "Entry",
    ref: mount.root,
    name: mount.name,
    kind: "directory",
    project: id,
    parent: name,
  }));

export class References extends Context.Service<
  References,
  { readonly search: (query: string) => Effect.Effect<ReadonlyArray<ReferenceMatch>> }
>()("@starlight/core/References") {
  static readonly layer = Layer.effect(References)(
    Effect.gen(function* () {
      const projects = yield* Projects;
      const chats = yield* ChatStore;

      const searchSource = (source: SourceId, owners: ReadonlyArray<Owner>, query: string) =>
        Effect.gen(function* () {
          const driver = yield* projects.driverFor(source);
          const roots = owners.map(({ mount }) => mount.root.id);
          const entries = yield* driver.search(roots, query, ENTRY_LIMIT);
          return entries.flatMap((entry): ReadonlyArray<ReferenceMatch> => {
            const owner = owners.find(({ mount }) => driver.contains(mount.root.id, entry.id));
            if (!owner) return [];
            const parent = driver.trail(owner.mount.root.id, entry.id).at(-2)?.name ?? owner.mount.name;
            return [
              {
                _tag: "Entry",
                ref: { source, id: entry.id },
                name: entry.name,
                kind: entry.kind,
                project: owner.project,
                parent,
              },
            ];
          });
        }).pipe(Effect.orElseSucceed((): ReadonlyArray<ReferenceMatch> => []));

      const searchEntries = Effect.fn("References.searchEntries")(function* (query: string) {
        const all = yield* projects.list;
        if (query === "") return all.flatMap(rootsOf);
        const found = yield* Effect.forEach(
          ownersBySource(all),
          ([source, owners]) => searchSource(source, owners, query),
          { concurrency: "unbounded" },
        );
        return found.flat();
      });

      return References.of({
        search: Effect.fn("References.search")(function* (query) {
          const [entries, matchedChats] = yield* Effect.all(
            [searchEntries(query), chats.search(query, CHAT_LIMIT)],
            { concurrency: "unbounded" },
          );
          return [
            ...entries,
            ...matchedChats.map((chat): ReferenceMatch => ({ _tag: "Chat", id: chat.id, title: chat.title })),
          ];
        }),
      });
    }),
  );
}
