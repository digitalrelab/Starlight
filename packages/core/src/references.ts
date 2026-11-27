import {
  type EntryLocation,
  type EntryRef,
  type FileKind,
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
  type StoredEntry,
} from "./ports.ts";
import { mountOf, Projects } from "./projects.ts";

const ENTRY_LIMIT = 12;
const CHAT_LIMIT = 6;
const PREVIEWED = new Set<FileKind>(["image", "video"]);

const sameEntry = (a: ReferenceMatch, b: ReferenceMatch) =>
  a._tag === "Entry" && b._tag === "Entry" && a.ref.source === b.ref.source && a.ref.id === b.ref.id;

const previewable = (entry: SourceEntry) => entry.kind === "file" && PREVIEWED.has(fileKindOf(entry.name));

const rootsOf = ({ name, mounts }: Project) =>
  mounts.map((mount): ReferenceMatch => ({
    _tag: "Entry",
    ref: mount.root,
    name: mount.name,
    kind: "directory",
    parentName: name,
    preview: null,
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

      const previewOf = (ref: EntryRef, { fileId, ...entry }: StoredEntry) =>
        fileId !== null && previewable(entry) ? tokens.issue(ref, { ...entry, fileId }) : null;

      const indexedPreview = (driver: SourceDriver, ref: EntryRef, entry: SourceEntry) =>
        previewable(entry)
          ? Effect.map(
              index.bind(driver, { source: ref.source, id: driver.parent(ref.id) }, [entry]),
              ([identified]) => (identified ? previewOf(ref, identified) : null),
            )
          : Effect.succeed(null);

      const owned = (all: ReadonlyArray<Project>, { source, entry, parentName }: EntryMatch) => {
        const ref = { source, id: entry.id };
        return projects.driverFor(source).pipe(
          Effect.map((driver): ReadonlyArray<ReferenceMatch> => {
            const mount = all.flatMap((project) => mountOf(project, driver, ref) ?? []).at(0);
            if (!mount) return [];
            const { name, kind } = entry;
            const preview = previewOf(ref, entry);
            return [{ _tag: "Entry", ref, name, kind, parentName: parentName ?? mount.name, preview }];
          }),
          Effect.orElseSucceed((): ReadonlyArray<ReferenceMatch> => []),
        );
      };

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
            preview: project ? yield* indexedPreview(driver, ref, entry) : null,
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
