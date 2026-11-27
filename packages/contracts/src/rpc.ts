import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/rpc";
import { Entry, EntryChange } from "./entry.ts";
import { DirectoryError, FileSystemError, NotADirectory, WorkspaceNotFound } from "./errors.ts";
import { RelativePath, WorkspaceId } from "./ids.ts";
import { Media } from "./media.ts";
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
    error: DirectoryError,
  }),
  Rpc.make("ListMedia", {
    payload: { workspaceId: WorkspaceId, path: RelativePath },
    success: Schema.Array(Media),
    error: DirectoryError,
  }),
  Rpc.make("WatchEntries", {
    payload: { workspaceId: WorkspaceId },
    success: EntryChange,
    error: Schema.Union([WorkspaceNotFound, FileSystemError]),
    stream: true,
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
  Rpc.make("DownloadUpdate"),
  Rpc.make("InstallUpdate"),
) {}
