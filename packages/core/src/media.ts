import {
  type DirectoryError,
  type FileError,
  type FileSource,
  joinRelative,
  type Media,
  type WorkspaceId,
} from "@starlight/contracts";
import { Array as Arr, Context, Effect, Layer, Option, Path } from "effect";
import { FileSystemPort, FileTokens, MediaProbe } from "./ports.ts";
import { Workspaces } from "./workspaces.ts";

const PROBE_CONCURRENCY = 32;

export class MediaLibrary extends Context.Service<
  MediaLibrary,
  {
    readonly list: (
      workspaceId: WorkspaceId,
      path: string,
    ) => Effect.Effect<ReadonlyArray<Media>, DirectoryError>;
    readonly source: (workspaceId: WorkspaceId, path: string) => Effect.Effect<FileSource, FileError>;
  }
>()("@starlight/core/MediaLibrary") {
  static readonly layer = Layer.effect(MediaLibrary)(
    Effect.gen(function* () {
      const fs = yield* FileSystemPort;
      const workspaces = yield* Workspaces;
      const probe = yield* MediaProbe;
      const tokens = yield* FileTokens;
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
                      ...dimensions,
                      path: joinRelative(relative, entry.name),
                      token: tokens.issue(file, entry.modifiedAt),
                    })),
                  ),
                );
            },
            { concurrency: PROBE_CONCURRENCY },
          );
          return Arr.getSomes(media);
        }),
        source: Effect.fn("MediaLibrary.source")(function* (workspaceId, file) {
          const { absolute, stat } = yield* workspaces.resolveFile(workspaceId, file);
          const dimensions = yield* probe.dimensions({ absolute, ...stat });
          return {
            token: tokens.issue(absolute, stat.modifiedAt),
            dimensions: Option.getOrNull(dimensions),
          };
        }),
      });
    }),
  );
}
