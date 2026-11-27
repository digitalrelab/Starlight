import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/rpc";
import { Entry } from "./entry.ts";
import { FileSystemError, NotADirectory, PathOutsideWorkspace, WorkspaceNotFound } from "./errors.ts";
import { RelativePath, WorkspaceId } from "./ids.ts";
import { Workspace } from "./workspace.ts";

export class WorkspaceRpcs extends RpcGroup.make(
  Rpc.make("OpenWorkspace", {
    payload: { path: Schema.String },
    success: Workspace,
    error: Schema.Union([NotADirectory, FileSystemError]),
  }),
  Rpc.make("ListRecentWorkspaces", {
    success: Schema.Array(Workspace),
  }),
  Rpc.make("GetWorkspace", {
    payload: { workspaceId: WorkspaceId },
    success: Workspace,
    error: WorkspaceNotFound,
  }),
  Rpc.make("ListEntries", {
    payload: { workspaceId: WorkspaceId, path: RelativePath },
    success: Schema.Array(Entry),
    error: Schema.Union([WorkspaceNotFound, PathOutsideWorkspace, NotADirectory, FileSystemError]),
  }),
) {}

export class ShellRpcs extends RpcGroup.make(
  Rpc.make("PickDirectory", {
    success: Schema.NullOr(Schema.String),
  }),
) {}
