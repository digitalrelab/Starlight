import type { EntryMatch, Project, ProjectId } from "@starlight/contracts";
import { Array as Arr, Context, Effect, Layer, Option } from "effect";
import { EntryStore, FileTokens, type FoundEntry, type SourceDriver } from "./ports.ts";
import { ownerOf, Projects } from "./projects.ts";

const FOLDER_LIMIT = 8;
const FILE_LIMIT = 24;

export class EntrySearch extends Context.Service<
  EntrySearch,
  {
    readonly search: (
      query: string,
      preferred: ProjectId | null,
      includeHidden: boolean,
    ) => Effect.Effect<ReadonlyArray<EntryMatch>>;
  }
>()("@starlight/core/EntrySearch") {
  static readonly layer = Layer.effect(EntrySearch)(
    Effect.gen(function* () {
      const store = yield* EntryStore;
      const projects = yield* Projects;
      const tokens = yield* FileTokens;

      const matchOf = (found: FoundEntry, driver: SourceDriver, candidates: ReadonlyArray<Project>) => {
        const ref = { source: found.source, id: found.id };
        const owner = ownerOf(candidates, driver, ref);
        if (!owner) return Option.none<EntryMatch>();
        const { project, mount } = owner;
        return Option.some<EntryMatch>({
          ref,
          location: {
            name: found.name,
            kind: found.kind,
            project: project.id,
            directory: found.kind === "directory" ? ref : { source: found.source, id: found.parent },
            token:
              found.kind === "file" && found.fileId
                ? tokens.issue(ref, { ...found, fileId: found.fileId })
                : null,
          },
          folders: [mount.name, ...driver.trail(mount.root.id, found.parent).map(({ name }) => name)],
        });
      };

      return EntrySearch.of({
        search: Effect.fn("EntrySearch.search")(function* (query, preferred, includeHidden) {
          const text = query.trim();
          if (text === "") return [];
          const [folders, files, all] = yield* Effect.all([
            store.search({ text, group: "folders", includeHidden, limit: FOLDER_LIMIT }),
            store.search({ text, group: "files", includeHidden, limit: FILE_LIMIT }),
            projects.list,
          ]);
          const candidates = all.toSorted((a, b) => Number(b.id === preferred) - Number(a.id === preferred));
          const matches = yield* Effect.forEach([...folders, ...files], (entry) =>
            projects.driverFor(entry.source).pipe(
              Effect.map((driver) => matchOf(entry, driver, candidates)),
              Effect.orElseSucceed(() => Option.none<EntryMatch>()),
            ),
          );
          return Arr.getSomes(matches);
        }),
      });
    }),
  );
}
