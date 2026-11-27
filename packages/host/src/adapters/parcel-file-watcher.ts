import { type BackendType, subscribe } from "@parcel/watcher";
import type { FileSystemError } from "@starlight/contracts";
import { type FileWatchEvent, FileWatcherPort } from "@starlight/core";
import { Effect, Layer, Queue, Stream } from "effect";
import { toFileSystemError } from "./file-system-error.ts";

const backends: Partial<Record<NodeJS.Platform, BackendType>> = {
  darwin: "fs-events",
  linux: "inotify",
  win32: "windows",
};

const backend = backends[process.platform];
const options = backend ? { backend } : {};

const resync: FileWatchEvent = { _tag: "Resync" };

export const ParcelFileWatcherLive = Layer.succeed(FileWatcherPort)({
  watch: (path) =>
    Stream.callback<FileWatchEvent, FileSystemError>((queue) =>
      Effect.acquireRelease(
        Effect.tryPromise({
          try: () =>
            subscribe(
              path,
              (error, events) => {
                Queue.offerUnsafe(
                  queue,
                  error ? resync : { _tag: "Changed", paths: events.map((event) => event.path) },
                );
              },
              options,
            ),
          catch: toFileSystemError(path),
        }),
        (subscription) => Effect.ignore(Effect.tryPromise(() => subscription.unsubscribe())),
      ).pipe(Effect.andThen(Queue.offer(queue, resync))),
    ),
});
