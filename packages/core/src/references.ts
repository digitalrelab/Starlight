import type {
  EntryLocation,
  EntryMatch,
  EntryRef,
  Project,
  ProjectId,
  ReferenceMatch,
  SourceError,
  SourceUnavailable,
} from "@starlight/contracts";
import { Array as Arr, Context, Effect, Layer } from "effect";
import { EntryIndex } from "./entry-index.ts";
import { ChatStore, FileTokens, type SourceDriver, type SourceEntry } from "./ports.ts";
import { ownerOf, Projects } from "./projects.ts";
import { EntrySearch } from "./search.ts";

const CHAT_LIMIT = 6;

const rootsOf = (project: Project) =>
  project.mounts.map((mount): EntryMatch => ({
    ref: mount.root,
    location: {
      name: mount.name,
      kind: "directory",
      project: project.id,
      directory: mount.root,
      token: null,
    },
    folders: [project.name],
  }));

const sameRef = (a: EntryMatch, b: EntryMatch) => a.ref.source === b.ref.source && a.ref.id === b.ref.id;

export class References extends Context.Service<
  References,
  {
    readonly search: (
      query: string,
      preferred: ProjectId | null,
      includeHidden: boolean,
    ) => Effect.Effect<ReadonlyArray<ReferenceMatch>>;
    readonly locate: (ref: EntryRef) => Effect.Effect<EntryLocation, SourceUnavailable | SourceError>;
  }
>()("@starlight/core/References") {
  static readonly layer = Layer.effect(References)(
    Effect.gen(function* () {
      const projects = yield* Projects;
      const entrySearch = yield* EntrySearch;
      const chats = yield* ChatStore;
      const index = yield* EntryIndex;
      const tokens = yield* FileTokens;

      const tokenOf = (driver: SourceDriver, ref: EntryRef, entry: SourceEntry) =>
        Effect.map(
          index.bind(driver, { source: ref.source, id: driver.parent(ref.id) }, [entry]),
          ([identified]) => (identified ? tokens.issue(ref, identified) : null),
        );

      const searchEntries = (query: string, preferred: ProjectId | null, includeHidden: boolean) =>
        query === ""
          ? Effect.map(projects.list, (all) => Arr.dedupeWith(all.flatMap(rootsOf), sameRef))
          : entrySearch.search(query, preferred, includeHidden);

      return References.of({
        search: Effect.fn("References.search")(function* (query, preferred, includeHidden) {
          const text = query.trim();
          const [entries, found] = yield* Effect.all(
            [searchEntries(text, preferred, includeHidden), chats.search(text, CHAT_LIMIT)],
            { concurrency: "unbounded" },
          );
          return [
            ...entries.map((match): ReferenceMatch => ({ _tag: "Entry", ...match })),
            ...found.map((chat): ReferenceMatch => ({ _tag: "Chat", id: chat.id, title: chat.title })),
          ];
        }),
        locate: Effect.fn("References.locate")(function* (requested) {
          const driver = yield* projects.driverFor(requested.source);
          const ref = { source: requested.source, id: yield* driver.canonicalize(requested.id) };
          const entry = yield* driver.stat(ref.id);
          const owner = ownerOf(yield* projects.list, driver, ref);
          return {
            name: entry.name,
            kind: entry.kind,
            project: owner?.project.id ?? null,
            directory: entry.kind === "directory" ? ref : { source: ref.source, id: driver.parent(ref.id) },
            token: owner && entry.kind === "file" ? yield* tokenOf(driver, ref, entry) : null,
          };
        }),
      });
    }),
  );
}
