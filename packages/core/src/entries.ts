import {
  type DirectoryError,
  type Entry,
  type EntryChange,
  type FileSystemError,
  joinRelative,
  type WorkspaceId,
  type WorkspaceNotFound,
} from "@starlight/contracts";
import { Context, Effect, Layer, Option, Result, Stream } from "effect";
import { type FileWatchEvent, FileSystemPort, FileWatcherPort } from "./ports.ts";
import { Workspaces } from "./workspaces.ts";

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

const byKindThenName = (a: Entry, b: Entry) => {
  const aDir = a.kind === "directory" ? 0 : 1;
  const bDir = b.kind === "directory" ? 0 : 1;
  return aDir - bDir || collator.compare(a.name, b.name);
};

const MAX_CHANGED_PATHS = 1024;

const resync: EntryChange = { _tag: "Resync" };

const toChange =
  (relativize: (absolute: string) => Option.Option<string>) =>
  (event: FileWatchEvent): Result.Result<EntryChange, void> => {
    if (event._tag === "Resync" || event.paths.length > MAX_CHANGED_PATHS) return Result.succeed(resync);
    const paths = event.paths.flatMap((absolute) => Option.toArray(relativize(absolute)));
    return paths.length === 0 ? Result.failVoid : Result.succeed({ _tag: "Changed", paths });
  };

export class Entries extends Context.Service<
  Entries,
  {
    readonly list: (
      workspaceId: WorkspaceId,
      path: string,
    ) => Effect.Effect<ReadonlyArray<Entry>, DirectoryError>;
    readonly watch: (
      workspaceId: WorkspaceId,
    ) => Stream.Stream<EntryChange, WorkspaceNotFound | FileSystemError>;
  }
>()("@starlight/core/Entries") {
  static readonly layer = Layer.effect(Entries)(
    Effect.gen(function* () {
      const fs = yield* FileSystemPort;
      const watcher = yield* FileWatcherPort;
      const workspaces = yield* Workspaces;

      return Entries.of({
        list: Effect.fn("Entries.list")(function* (workspaceId, path) {
          const { absolute, relative } = yield* workspaces.resolveDirectory(workspaceId, path);
          const entries = yield* fs.readDirectory(absolute);
          return entries
            .map((entry): Entry => ({
              ...entry,
              path: joinRelative(relative, entry.name),
              hidden: entry.name.startsWith("."),
            }))
            .sort(byKindThenName);
        }),

        watch: (workspaceId) =>
          workspaces.get(workspaceId).pipe(
            Effect.map((workspace) =>
              watcher
                .watch(workspace.rootPath)
                .pipe(Stream.filterMap(toChange((absolute) => workspaces.relativize(workspace, absolute)))),
            ),
            Stream.unwrap,
          ),
      });
    }),
  );
}
