import type { Project, ReferenceMatch } from "@starlight/contracts";
import { Array as Arr, Context, Effect, Layer } from "effect";
import { ChatStore, type EntryMatch, EntryStore } from "./ports.ts";
import { mountOf, Projects } from "./projects.ts";

const ENTRY_LIMIT = 12;
const CHAT_LIMIT = 6;

const sameEntry = (a: ReferenceMatch, b: ReferenceMatch) =>
  a._tag === "Entry" && b._tag === "Entry" && a.ref.source === b.ref.source && a.ref.id === b.ref.id;

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

      const owned = (all: ReadonlyArray<Project>, { ref, name, kind, parentName }: EntryMatch) =>
        projects.driverFor(ref.source).pipe(
          Effect.map((driver): ReadonlyArray<ReferenceMatch> => {
            for (const project of all) {
              const mount = mountOf(project, driver, ref);
              if (mount)
                return [
                  {
                    _tag: "Entry",
                    ref,
                    name,
                    kind,
                    project: project.id,
                    parentName: parentName ?? mount.name,
                  },
                ];
            }
            return [];
          }),
          Effect.orElseSucceed((): ReadonlyArray<ReferenceMatch> => []),
        );

      const searchEntries = Effect.fn("References.searchEntries")(function* (query: string) {
        const all = yield* projects.list;
        if (query === "") return Arr.dedupeWith(all.flatMap(rootsOf), sameEntry);
        const found = yield* Effect.forEach(yield* entries.search(query, ENTRY_LIMIT), (match) =>
          owned(all, match),
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
