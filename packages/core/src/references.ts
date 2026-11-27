import type { Mount, Project, ProjectId, ReferenceMatch } from "@starlight/contracts";
import { Context, Effect, Layer } from "effect";
import { ChatStore, type EntryMatch, EntryStore } from "./ports.ts";
import { Projects } from "./projects.ts";

const ENTRY_LIMIT = 12;
const CHAT_LIMIT = 6;

interface Owner {
  readonly mount: Mount;
  readonly project: ProjectId;
}

const rootsOf = ({ id, name, mounts }: Project) =>
  mounts.map((mount): ReferenceMatch => ({
    _tag: "Entry",
    ref: mount.root,
    name: mount.name,
    kind: "directory",
    project: id,
    parentName: name,
  }));

export class References extends Context.Service<
  References,
  { readonly search: (query: string) => Effect.Effect<ReadonlyArray<ReferenceMatch>> }
>()("@starlight/core/References") {
  static readonly layer = Layer.effect(References)(
    Effect.gen(function* () {
      const projects = yield* Projects;
      const chats = yield* ChatStore;
      const entries = yield* EntryStore;

      const owned = (owners: ReadonlyArray<Owner>, match: EntryMatch) =>
        projects.driverFor(match.ref.source).pipe(
          Effect.map((driver): ReadonlyArray<ReferenceMatch> => {
            const owner = owners.find(
              ({ mount }) =>
                mount.root.source === match.ref.source && driver.contains(mount.root.id, match.ref.id),
            );
            if (!owner) return [];
            const { ref, name, kind, parentName } = match;
            return [
              {
                _tag: "Entry",
                ref,
                name,
                kind,
                project: owner.project,
                parentName: parentName ?? owner.mount.name,
              },
            ];
          }),
          Effect.orElseSucceed((): ReadonlyArray<ReferenceMatch> => []),
        );

      const searchEntries = Effect.fn("References.searchEntries")(function* (query: string) {
        const all = yield* projects.list;
        if (query === "") return all.flatMap(rootsOf);
        const owners = all.flatMap(({ id, mounts }) =>
          mounts.map((mount): Owner => ({ mount, project: id })),
        );
        const found = yield* Effect.forEach(yield* entries.search(query, ENTRY_LIMIT), (match) =>
          owned(owners, match),
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
