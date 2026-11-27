import type { Mount, Project, ProjectId, ReferenceMatch, SourceId } from "@starlight/contracts";
import { Context, Effect, Layer } from "effect";
import { ChatStore } from "./ports.ts";
import { Projects } from "./projects.ts";

const SEARCH_LIMIT = 12;

const mountsBySource = (projects: ReadonlyArray<Project>) => {
  const groups = new Map<SourceId, Array<{ readonly mount: Mount; readonly project: ProjectId }>>();
  for (const project of projects) {
    for (const mount of project.mounts) {
      const group = groups.get(mount.root.source) ?? [];
      group.push({ mount, project: project.id });
      groups.set(mount.root.source, group);
    }
  }
  return groups;
};

export class References extends Context.Service<
  References,
  { readonly search: (query: string) => Effect.Effect<ReadonlyArray<ReferenceMatch>> }
>()("@starlight/core/References") {
  static readonly layer = Layer.effect(References)(
    Effect.gen(function* () {
      const projects = yield* Projects;
      const chats = yield* ChatStore;

      const searchEntries = Effect.fn("References.searchEntries")(function* (query: string) {
        const groups = mountsBySource(yield* projects.list);
        const found = yield* Effect.forEach(
          groups,
          ([source, mounts]) =>
            projects.driverFor(source).pipe(
              Effect.flatMap((driver) =>
                driver
                  .search(
                    mounts.map(({ mount }) => mount.root.id),
                    query,
                    SEARCH_LIMIT,
                  )
                  .pipe(
                    Effect.map((entries) =>
                      entries.flatMap((entry): ReadonlyArray<ReferenceMatch> => {
                        const owner = mounts.find(({ mount }) => driver.contains(mount.root.id, entry.id));
                        return owner
                          ? [
                              {
                                _tag: "Entry",
                                ref: { source, id: entry.id },
                                name: entry.name,
                                kind: entry.kind,
                                project: owner.project,
                              },
                            ]
                          : [];
                      }),
                    ),
                  ),
              ),
              Effect.orElseSucceed((): ReadonlyArray<ReferenceMatch> => []),
            ),
          { concurrency: "unbounded" },
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
