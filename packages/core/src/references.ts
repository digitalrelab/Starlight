import type { Mount, Project, ProjectId, ReferenceMatch, SourceId } from "@starlight/contracts";
import { Context, Effect, Layer } from "effect";
import { ChatStore } from "./ports.ts";
import { Projects } from "./projects.ts";

const SEARCH_LIMIT = 12;

interface Owner {
  readonly mount: Mount;
  readonly project: ProjectId;
}

const ownersBySource = (projects: ReadonlyArray<Project>) =>
  Map.groupBy(
    projects.flatMap(({ id, mounts }) => mounts.map((mount): Owner => ({ mount, project: id }))),
    ({ mount }) => mount.root.source,
  );

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
          const entries = yield* driver.search(roots, query, SEARCH_LIMIT);
          return entries.flatMap((entry): ReadonlyArray<ReferenceMatch> => {
            const owner = owners.find(({ mount }) => driver.contains(mount.root.id, entry.id));
            if (!owner) return [];
            const ref = { source, id: entry.id };
            return [{ _tag: "Entry", ref, name: entry.name, kind: entry.kind, project: owner.project }];
          });
        }).pipe(Effect.orElseSucceed((): ReadonlyArray<ReferenceMatch> => []));

      const searchEntries = Effect.fn("References.searchEntries")(function* (query: string) {
        const groups = ownersBySource(yield* projects.list);
        const found = yield* Effect.forEach(
          groups,
          ([source, owners]) => searchSource(source, owners, query),
          {
            concurrency: "unbounded",
          },
        );
        return found.flat();
      });

      return References.of({
        search: Effect.fn("References.search")(function* (query) {
          const [entries, matchedChats] = yield* Effect.all(
            [searchEntries(query), chats.search(query, SEARCH_LIMIT)],
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
