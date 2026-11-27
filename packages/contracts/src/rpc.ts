import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/rpc";
import { Entry } from "./entry.ts";
import { FileSystemError, NotADirectory, PathOutsideWorkspace, WorkspaceNotFound } from "./errors.ts";
import { RelativePath, WorkspaceId } from "./ids.ts";
import { Settings, SettingsPatch } from "./settings.ts";
import { Update } from "./update.ts";
import { Workspace } from "./workspace.ts";

export class HostRpcs extends RpcGroup.make(
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
  Rpc.make("GetSettings", {
    success: Settings,
  }),
  Rpc.make("UpdateSettings", {
    payload: SettingsPatch,
    success: Settings,
  }),
) {}

export class ShellRpcs extends RpcGroup.make(
  Rpc.make("PickDirectory", {
    success: Schema.NullOr(Schema.String),
  }),
  Rpc.make("WatchUpdates", {
    success: Update,
    stream: true,
  }),
  Rpc.make("InstallUpdate"),
) {}
