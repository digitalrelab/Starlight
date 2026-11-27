import type { DirectoryError, EntryRef, Media, WorkspaceId } from "@starlight/contracts";
import { Array as Arr, Context, Effect, Layer, Option } from "effect";
import { ThumbnailTokens } from "./ports.ts";
import { Workspaces } from "./workspaces.ts";

const PROBE_CONCURRENCY = 32;

export class MediaLibrary extends Context.Service<
  MediaLibrary,
  {
    readonly list: (
      workspaceId: WorkspaceId,
      directory: EntryRef | null,
    ) => Effect.Effect<ReadonlyArray<Media>, DirectoryError>;
  }
>()("@starlight/core/MediaLibrary") {
  static readonly layer = Layer.effect(MediaLibrary)(
    Effect.gen(function* () {
      const workspaces = yield* Workspaces;
      const tokens = yield* ThumbnailTokens;

      return MediaLibrary.of({
        list: Effect.fn("MediaLibrary.list")(function* (workspaceId, requested) {
          if (!requested) return [];
          const { driver, directory } = yield* workspaces.locateDirectory(workspaceId, requested);
          const files = (yield* driver.list(directory.id)).filter((entry) => entry.kind === "file");
          const media = yield* Effect.forEach(
            files,
            (entry) => {
              const ref = { source: directory.source, id: entry.id };
              return driver.dimensions(entry).pipe(
                Effect.map(
                  Option.map((dimensions): Media => ({
                    ref,
                    ...dimensions,
                    thumbnail: tokens.issue(ref, entry.modifiedAt),
                  })),
                ),
              );
            },
            { concurrency: PROBE_CONCURRENCY },
          );
          return Arr.getSomes(media);
        }),
      });
    }),
  );
}
