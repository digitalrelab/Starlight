import {
  type DirectoryError,
  type FileError,
  type FileSystemError,
  NotADirectory,
  NotAFile,
  PathOutsideWorkspace,
  type Workspace,
  type WorkspaceId,
  WorkspaceNotFound,
} from "@starlight/contracts";
import { Context, Effect, Layer, Option, Path } from "effect";
import { AuditLog, CurrentActor, type FileStat, FileSystemPort, WorkspaceStore } from "./ports.ts";

const RECENT_LIMIT = 20;

export interface Resolved {
  readonly absolute: string;
  readonly relative: string;
  readonly stat: FileStat;
}

export class Workspaces extends Context.Service<
  Workspaces,
  {
    readonly open: (path: string) => Effect.Effect<Workspace, NotADirectory | FileSystemError, CurrentActor>;
    readonly recent: Effect.Effect<ReadonlyArray<Workspace>>;
    readonly get: (id: WorkspaceId) => Effect.Effect<Workspace, WorkspaceNotFound>;
    readonly relativize: (workspace: Workspace, absolute: string) => Option.Option<string>;
    readonly resolveDirectory: (id: WorkspaceId, relative: string) => Effect.Effect<Resolved, DirectoryError>;
    readonly resolveFile: (id: WorkspaceId, relative: string) => Effect.Effect<Resolved, FileError>;
  }
>()("@starlight/core/Workspaces") {
  static readonly layer = Layer.effect(Workspaces)(
    Effect.gen(function* () {
      const fs = yield* FileSystemPort;
      const store = yield* WorkspaceStore;
      const audit = yield* AuditLog;
      const path = yield* Path.Path;

      const isWithin = (root: string, candidate: string) =>
        candidate === root || candidate.startsWith(root.endsWith(path.sep) ? root : root + path.sep);

      const relativize = (workspace: Workspace, absolute: string) =>
        isWithin(workspace.rootPath, absolute)
          ? Option.some(path.relative(workspace.rootPath, absolute).split(path.sep).join("/"))
          : Option.none();

      const get = (id: WorkspaceId) =>
        store.findById(id).pipe(
          Effect.flatMap(
            Option.match({
              onNone: () => Effect.fail(new WorkspaceNotFound({ workspaceId: id })),
              onSome: Effect.succeed,
            }),
          ),
        );

      const resolve = Effect.fnUntraced(function* (id: WorkspaceId, relative: string) {
        const workspace = yield* get(id);
        const lexical = path.resolve(workspace.rootPath, relative);
        if (!isWithin(workspace.rootPath, lexical))
          return yield* new PathOutsideWorkspace({ path: relative });
        const absolute = yield* fs.realPath(lexical);
        const inside = relativize(workspace, absolute);
        if (Option.isNone(inside)) return yield* new PathOutsideWorkspace({ path: relative });
        return { absolute, relative: inside.value, stat: yield* fs.stat(absolute) };
      });

      return Workspaces.of({
        open: Effect.fn("Workspaces.open")(function* (input) {
          const rootPath = yield* fs.realPath(input);
          const info = yield* fs.stat(rootPath);
          if (info.kind !== "directory") return yield* new NotADirectory({ path: rootPath });
          const workspace = yield* store.upsert({ rootPath, name: path.basename(rootPath) || rootPath });
          yield* audit.record({ actor: yield* CurrentActor, action: "OpenWorkspace", target: rootPath });
          return workspace;
        }),
        recent: store.recent(RECENT_LIMIT),
        get,
        relativize,
        resolveDirectory: Effect.fn("Workspaces.resolveDirectory")(function* (id, relative) {
          const resolved = yield* resolve(id, relative);
          if (resolved.stat.kind !== "directory")
            return yield* new NotADirectory({ path: resolved.relative });
          return resolved;
        }),
        resolveFile: Effect.fn("Workspaces.resolveFile")(function* (id, relative) {
          const resolved = yield* resolve(id, relative);
          if (resolved.stat.kind !== "file") return yield* new NotAFile({ path: resolved.relative });
          return resolved;
        }),
      });
    }),
  );
}
