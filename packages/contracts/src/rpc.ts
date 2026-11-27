import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/rpc";
import { AgentProvider, ModelChoice } from "./agent.ts";
import { Chat, ChatBusy, ChatDetail, ChatEvent, ChatId, ChatNotFound, ModelUnavailable } from "./chat.ts";
import { DiskUsage } from "./disk.ts";
import { EntryChange, Listing } from "./entry.ts";
import {
  DirectoryError,
  FileError,
  MountError,
  WriteError,
  SourceError,
  SourceUnavailable,
  WorkspaceNotFound,
} from "./errors.ts";
import { EntryRef, WorkspaceId } from "./ids.ts";
import { FileSource, FileVersion, Media, MediaUpdate } from "./media.ts";
import { UpdaterState } from "./update.ts";
import { Workspace } from "./workspace.ts";

const DirectoryRequest = { workspaceId: WorkspaceId, directory: Schema.NullOr(EntryRef) };

export class HostRpcs extends RpcGroup.make(
  Rpc.make("CreateWorkspace", {
    payload: { root: EntryRef },
    success: Workspace,
    error: MountError,
  }),
  Rpc.make("ListWorkspaces", {
    success: Schema.Array(Workspace),
  }),
  Rpc.make("GetWorkspace", {
    payload: { workspaceId: WorkspaceId },
    success: Workspace,
    error: WorkspaceNotFound,
  }),
  Rpc.make("RenameWorkspace", {
    payload: { workspaceId: WorkspaceId, name: Schema.NonEmptyString },
    success: Workspace,
    error: WorkspaceNotFound,
  }),
  Rpc.make("DeleteWorkspace", {
    payload: { workspaceId: WorkspaceId },
    error: WorkspaceNotFound,
  }),
  Rpc.make("AddMount", {
    payload: { workspaceId: WorkspaceId, root: EntryRef },
    success: Workspace,
    error: Schema.Union([WorkspaceNotFound, MountError]),
  }),
  Rpc.make("RemoveMount", {
    payload: { workspaceId: WorkspaceId, root: EntryRef },
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
  Rpc.make("ProcessMedia", {
    payload: DirectoryRequest,
    success: Schema.Array(MediaUpdate),
    error: DirectoryError,
    stream: true,
  }),
  Rpc.make("GetFileSource", {
    payload: { workspaceId: WorkspaceId, file: EntryRef },
    success: FileSource,
    error: FileError,
  }),
  Rpc.make("WriteFile", {
    payload: { workspaceId: WorkspaceId, file: EntryRef, content: Schema.Uint8Array, base: FileVersion },
    success: FileVersion,
    error: WriteError,
  }),
  Rpc.make("WatchEntries", {
    payload: { workspaceId: WorkspaceId },
    success: EntryChange,
    error: Schema.Union([WorkspaceNotFound, SourceUnavailable, SourceError]),
    stream: true,
  }),
  Rpc.make("ListAgentProviders", {
    success: Schema.Array(AgentProvider),
  }),
  Rpc.make("ListChats", {
    success: Schema.Array(Chat),
  }),
  Rpc.make("GetChat", {
    payload: { chatId: ChatId },
    success: ChatDetail,
    error: ChatNotFound,
  }),
  Rpc.make("SendMessage", {
    payload: {
      chatId: Schema.NullOr(ChatId),
      text: Schema.NonEmptyString,
      model: ModelChoice,
    },
    success: Chat,
    error: Schema.Union([ChatNotFound, ChatBusy, ModelUnavailable]),
  }),
  Rpc.make("RenameChat", {
    payload: { chatId: ChatId, title: Schema.NonEmptyString },
    success: Chat,
    error: ChatNotFound,
  }),
  Rpc.make("DeleteChat", {
    payload: { chatId: ChatId },
    error: ChatNotFound,
  }),
  Rpc.make("WatchChat", {
    payload: { chatId: ChatId },
    success: ChatEvent,
    error: ChatNotFound,
    stream: true,
  }),
) {}

export class ShellRpcs extends RpcGroup.make(
  Rpc.make("PickDirectory", {
    success: Schema.NullOr(EntryRef),
  }),
  Rpc.make("WatchUpdater", {
    success: UpdaterState,
    stream: true,
  }),
  Rpc.make("CheckForUpdates"),
  Rpc.make("DownloadUpdate"),
  Rpc.make("InstallUpdate"),
  Rpc.make("GetDiskUsage", {
    success: DiskUsage,
  }),
  Rpc.make("ClearPreviews"),
) {}
