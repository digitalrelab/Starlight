import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/rpc";
import { EntryChange, Listing } from "./entry.ts";
import {
  DirectoryError,
  FileError,
  MountError,
  SourceError,
  SourceUnavailable,
  WorkspaceNotFound,
} from "./errors.ts";
import { EntryRef, WorkspaceId } from "./ids.ts";
import { FileSource, Media } from "./media.ts";
import { Update } from "./update.ts";
import { Workspace } from "./workspace.ts";

const DirectoryRequest = { workspaceId: WorkspaceId, directory: Schema.NullOr(EntryRef) };

export class HostRpcs extends RpcGroup.make(
  Rpc.make("OpenWorkspace", {
    payload: { root: EntryRef },
    success: Workspace,
    error: MountError,
  }),
  Rpc.make("AddMount", {
    payload: { workspaceId: WorkspaceId, root: EntryRef },
    success: Workspace,
    error: Schema.Union([WorkspaceNotFound, MountError]),
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
    payload: DirectoryRequest,
    success: Listing,
    error: DirectoryError,
  }),
  Rpc.make("ListMedia", {
    payload: DirectoryRequest,
    success: Schema.Array(Media),
    error: DirectoryError,
  }),
  Rpc.make("GetFileSource", {
    payload: { workspaceId: WorkspaceId, file: EntryRef },
    success: FileSource,
    error: FileError,
  }),
  Rpc.make("WatchEntries", {
    payload: { workspaceId: WorkspaceId },
    success: EntryChange,
    error: Schema.Union([WorkspaceNotFound, SourceUnavailable, SourceError]),
    stream: true,
  }),
) {}

export class ShellRpcs extends RpcGroup.make(
  Rpc.make("PickDirectory", {
    success: Schema.NullOr(EntryRef),
  }),
  Rpc.make("WatchUpdates", {
    success: Update,
    stream: true,
  }),
  Rpc.make("DownloadUpdate"),
  Rpc.make("InstallUpdate"),
) {}
