import {
  type FileSystemError,
  NotADirectory,
  PathOutsideWorkspace,
  type Workspace,
  type WorkspaceId,
  WorkspaceNotFound,
} from "@starlight/contracts";
import { Context, Effect, Layer, Option, Path } from "effect";
import { AuditLog, CurrentActor, FileSystemPort, WorkspaceStore } from "./ports.ts";

const RECENT_LIMIT = 20;

export class Workspaces extends Context.Service<
  Workspaces,
  {
    readonly open: (path: string) => Effect.Effect<Workspace, NotADirectory | FileSystemError, CurrentActor>;
    readonly recent: Effect.Effect<ReadonlyArray<Workspace>>;
    readonly get: (id: WorkspaceId) => Effect.Effect<Workspace, WorkspaceNotFound>;
    /** Resolves a workspace-relative path to its symlink-free absolute and canonical relative forms. */
    readonly resolve: (
      id: WorkspaceId,
      relative: string,
    ) => Effect.Effect<
      { readonly workspace: Workspace; readonly absolute: string; readonly relative: string },
      WorkspaceNotFound | PathOutsideWorkspace | FileSystemError
    >;
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

      const get = (id: WorkspaceId) =>
        store.findById(id).pipe(
          Effect.flatMap(
            Option.match({
              onNone: () => Effect.fail(new WorkspaceNotFound({ workspaceId: id })),
              onSome: Effect.succeed,
            }),
          ),
        );

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
        resolve: Effect.fn("Workspaces.resolve")(function* (id, relative) {
          const workspace = yield* get(id);
          const lexical = path.resolve(workspace.rootPath, relative);
          if (!isWithin(workspace.rootPath, lexical))
            return yield* new PathOutsideWorkspace({ path: relative });
          const absolute = yield* fs.realPath(lexical);
          if (!isWithin(workspace.rootPath, absolute))
            return yield* new PathOutsideWorkspace({ path: relative });
          return {
            workspace,
            absolute,
            relative: path.relative(workspace.rootPath, absolute).split(path.sep).join("/"),
          };
        }),
      });
    }),
  );
}
