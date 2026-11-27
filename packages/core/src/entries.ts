import {
  type Entry,
  type EntryChange,
  type FileSystemError,
  NotADirectory,
  type PathOutsideWorkspace,
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
    if (event._tag === "Resync") return Result.succeed(resync);
    const paths = new Set(event.paths.flatMap((absolute) => Option.toArray(relativize(absolute))));
    if (paths.size === 0) return Result.failVoid;
    return Result.succeed(paths.size > MAX_CHANGED_PATHS ? resync : { _tag: "Changed", paths: [...paths] });
  };

const join = (parent: string, name: string) => (parent === "" ? name : `${parent}/${name}`);

export class Entries extends Context.Service<
  Entries,
  {
    readonly list: (
      workspaceId: WorkspaceId,
      path: string,
    ) => Effect.Effect<
      ReadonlyArray<Entry>,
      WorkspaceNotFound | PathOutsideWorkspace | NotADirectory | FileSystemError
    >;
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
          const { absolute, relative } = yield* workspaces.resolve(workspaceId, path);
          const info = yield* fs.stat(absolute);
          if (info.kind !== "directory") return yield* new NotADirectory({ path: relative });
          const entries = yield* fs.readDirectory(absolute);
          return entries
            .map((entry): Entry => ({
              ...entry,
              path: join(relative, entry.name),
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
