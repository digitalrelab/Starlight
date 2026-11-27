import type {
  FileSystemError,
  Media,
  NotADirectory,
  PathOutsideWorkspace,
  WorkspaceId,
  WorkspaceNotFound,
} from "@starlight/contracts";
import { Array as Arr, Context, Effect, Layer, Option, Path } from "effect";
import { FileSystemPort, MediaProbe, ThumbnailTokens } from "./ports.ts";
import { joinRelative } from "./relative-path.ts";
import { Workspaces } from "./workspaces.ts";

const PROBE_CONCURRENCY = 32;

export class MediaLibrary extends Context.Service<
  MediaLibrary,
  {
    readonly list: (
      workspaceId: WorkspaceId,
      path: string,
    ) => Effect.Effect<
      ReadonlyArray<Media>,
      WorkspaceNotFound | PathOutsideWorkspace | NotADirectory | FileSystemError
    >;
  }
>()("@starlight/core/MediaLibrary") {
  static readonly layer = Layer.effect(MediaLibrary)(
    Effect.gen(function* () {
      const fs = yield* FileSystemPort;
      const workspaces = yield* Workspaces;
      const probe = yield* MediaProbe;
      const tokens = yield* ThumbnailTokens;
      const path = yield* Path.Path;

      return MediaLibrary.of({
        list: Effect.fn("MediaLibrary.list")(function* (workspaceId, directory) {
          const { absolute, relative } = yield* workspaces.resolveDirectory(workspaceId, directory);
          const files = (yield* fs.readDirectory(absolute)).filter((entry) => entry.kind === "file");
          const media = yield* Effect.forEach(
            files,
            (entry) => {
              const file = path.join(absolute, entry.name);
              return probe
                .dimensions({ absolute: file, size: entry.size, modifiedAt: entry.modifiedAt })
                .pipe(
                  Effect.map(
                    Option.map((dimensions): Media => ({
                      path: joinRelative(relative, entry.name),
                      width: dimensions.width,
                      height: dimensions.height,
                      thumbnail: tokens.issue(file, entry.modifiedAt),
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
