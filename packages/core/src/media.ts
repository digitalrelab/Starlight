import type { DirectoryError, EntryRef, Media, WorkspaceId } from "@starlight/contracts";
import { Context, Effect, Layer } from "effect";
import { Catalog } from "./catalog.ts";
import { FileTokens } from "./ports.ts";
import { Workspaces } from "./workspaces.ts";

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
      const tokens = yield* FileTokens;
      const catalog = yield* Catalog;

      return MediaLibrary.of({
        list: Effect.fn("MediaLibrary.list")(function* (workspaceId, requested) {
          if (!requested) return [];
          const { driver, directory } = yield* workspaces.locateDirectory(workspaceId, requested);
          const files = (yield* driver.list(directory.id)).filter((entry) => entry.kind === "file");
          const dimensions = yield* catalog.directory("dimensions", driver, directory, files);
          return files.flatMap((entry): ReadonlyArray<Media> => {
            const found = dimensions.get(entry.id);
            if (!found) return [];
            const ref = { source: directory.source, id: entry.id };
            return [{ ref, ...found, token: tokens.issue(ref, entry.modifiedAt) }];
          });
        }),
      });
    }),
  );
}
