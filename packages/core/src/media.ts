import type {
  DirectoryError,
  EntryId,
  EntryRef,
  Media,
  MediaAppearance,
  MediaUpdate,
  ProjectId,
  Property,
} from "@starlight/contracts";
import { Context, Effect, Layer, Stream } from "effect";
import { EntryIndex } from "./entry-index.ts";
import { Catalog } from "./catalog.ts";
import { FileTokens, type SourceChange } from "./ports.ts";
import { hasTransparency } from "./processors/traits.ts";
import { Projects } from "./projects.ts";

const appearanceOf = (
  placeholder: string | null = null,
  traits: ReadonlyArray<Property> = [],
): MediaAppearance => ({ placeholder, transparent: hasTransparency(traits) });

const touches = (directory: EntryId) => (change: SourceChange) =>
  change._tag === "Resync" || change.directories.includes(directory);

export class MediaLibrary extends Context.Service<
  MediaLibrary,
  {
    readonly list: (
      projectId: ProjectId,
      directory: EntryRef | null,
    ) => Effect.Effect<ReadonlyArray<Media>, DirectoryError>;
    readonly process: (
      projectId: ProjectId,
      directory: EntryRef | null,
    ) => Stream.Stream<ReadonlyArray<MediaUpdate>, DirectoryError>;
  }
>()("@starlight/core/MediaLibrary") {
  static readonly layer = Layer.effect(MediaLibrary)(
    Effect.gen(function* () {
      const projects = yield* Projects;
      const tokens = yield* FileTokens;
      const catalog = yield* Catalog;
      const index = yield* EntryIndex;

      const locate = Effect.fnUntraced(function* (projectId: ProjectId, requested: EntryRef) {
        const located = yield* projects.locateDirectory(projectId, requested);
        const { driver, directory } = located;
        const files = yield* index.bind(
          located,
          (yield* driver.list(directory.id)).filter((entry) => entry.kind === "file"),
        );
        const dimensions = yield* catalog.directory("dimensions", driver, directory, files);
        return { driver, directory, dimensions, media: files.filter((entry) => dimensions.has(entry.id)) };
      });

      const processDirectory = (projectId: ProjectId, requested: EntryRef) =>
        Stream.unwrap(
          Effect.map(locate(projectId, requested), ({ driver, directory, media }) =>
            catalog.process(driver, directory, media).pipe(
              Stream.map((batch) =>
                batch.flatMap(({ entry, facts }): ReadonlyArray<MediaUpdate> =>
                  facts
                    ? [
                        {
                          ref: { source: directory.source, id: entry.id },
                          ...appearanceOf(facts.placeholder, facts.traits),
                        },
                      ]
                    : [],
                ),
              ),
              Stream.filter((updates) => updates.length > 0),
            ),
          ),
        );

      return MediaLibrary.of({
        list: Effect.fn("MediaLibrary.list")(function* (projectId, requested) {
          if (!requested) return [];
          const { driver, directory, dimensions, media } = yield* locate(projectId, requested);
          const [durations, placeholders, traits] = yield* Effect.all([
            catalog.directory("duration", driver, directory, media),
            catalog.processed("placeholder", directory, media),
            catalog.processed("traits", directory, media),
          ]);
          return media.flatMap((entry): ReadonlyArray<Media> => {
            const found = dimensions.get(entry.id);
            if (!found) return [];
            const ref = { source: directory.source, id: entry.id };
            return [
              {
                ref,
                fileId: entry.fileId,
                ...found,
                duration: durations.get(entry.id) ?? null,
                ...appearanceOf(placeholders.get(entry.id), traits.get(entry.id)),
                token: tokens.issue(ref, entry),
              },
            ];
          });
        }),
        process: (projectId, requested) =>
          requested === null
            ? Stream.empty
            : Stream.unwrap(
                Effect.map(projects.locateDirectory(projectId, requested), ({ mount, driver, directory }) =>
                  driver.watch(mount.root.id).pipe(
                    Stream.filter(touches(directory.id)),
                    Stream.switchMap(() => processDirectory(projectId, requested)),
                  ),
                ),
              ),
      });
    }),
  );
}
