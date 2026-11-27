import type { DirectoryError, EntryId, EntryRef, Media, MediaUpdate, ProjectId } from "@starlight/contracts";
import { Context, Effect, Layer, Stream } from "effect";
import { FileIdentities } from "./file-identities.ts";
import { Catalog } from "./catalog.ts";
import { FileTokens, type SourceChange } from "./ports.ts";
import { Projects } from "./projects.ts";

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
      const identities = yield* FileIdentities;

      const locate = Effect.fnUntraced(function* (projectId: ProjectId, requested: EntryRef) {
        const { driver, directory } = yield* projects.locateDirectory(projectId, requested);
        const files = yield* identities.bind(
          driver,
          directory,
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
                    ? [{ ref: { source: directory.source, id: entry.id }, placeholder: facts.placeholder }]
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
          const [durations, placeholders] = yield* Effect.all([
            catalog.directory("duration", driver, directory, media),
            catalog.processed("placeholder", directory, media),
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
                placeholder: placeholders.get(entry.id) ?? null,
                token: tokens.issue({ ref, fileId: entry.fileId, version: entry.modifiedAt }),
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
