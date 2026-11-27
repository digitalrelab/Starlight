import {
  type EntryLocation,
  type EntryRef,
  fileKindOf,
  type Project,
  type ReferenceMatch,
  type SourceError,
  type SourceUnavailable,
} from "@starlight/contracts";
import { Array as Arr, Context, Effect, Layer } from "effect";
import { EntryIndex } from "./entry-index.ts";
import {
  ChatStore,
  type EntryMatch,
  EntryStore,
  FileTokens,
  type SourceDriver,
  type SourceEntry,
} from "./ports.ts";
import { mountOf, Projects } from "./projects.ts";

const ENTRY_LIMIT = 12;
const CHAT_LIMIT = 6;

const sameEntry = (a: ReferenceMatch, b: ReferenceMatch) =>
  a._tag === "Entry" && b._tag === "Entry" && a.ref.source === b.ref.source && a.ref.id === b.ref.id;

const PREVIEWED = new Set(["image", "video"]);

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
  {
    readonly search: (query: string) => Effect.Effect<ReadonlyArray<ReferenceMatch>>;
    readonly locate: (ref: EntryRef) => Effect.Effect<EntryLocation, SourceUnavailable | SourceError>;
  }
>()("@starlight/core/References") {
  static readonly layer = Layer.effect(References)(
    Effect.gen(function* () {
      const projects = yield* Projects;
      const chats = yield* ChatStore;
      const entries = yield* EntryStore;
      const index = yield* EntryIndex;
      const tokens = yield* FileTokens;

      const previewOf = Effect.fnUntraced(function* (
        driver: SourceDriver,
        ref: EntryRef,
        entry: SourceEntry,
      ) {
        if (entry.kind !== "file" || !PREVIEWED.has(fileKindOf(entry.name))) return null;
        const directory = { source: ref.source, id: driver.parent(ref.id) };
        const [identified] = yield* index.bind(driver, directory, [entry]);
        return identified ? tokens.issue(ref, identified) : null;
      });

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
        locate: Effect.fn("References.locate")(function* (requested) {
          const driver = yield* projects.driverFor(requested.source);
          const ref = { source: requested.source, id: yield* driver.canonicalize(requested.id) };
          const entry = yield* driver.stat(ref.id);
          const project = (yield* projects.list).find((candidate) => mountOf(candidate, driver, ref));
          return {
            name: entry.name,
            kind: entry.kind,
            project: project?.id ?? null,
            directory: entry.kind === "directory" ? ref : { source: ref.source, id: driver.parent(ref.id) },
            preview: project ? yield* previewOf(driver, ref, entry) : null,
          };
        }),
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
