import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/rpc";
import { AgentProvider } from "./agent.ts";
import {
  Conversation,
  ConversationBusy,
  ConversationDetail,
  ConversationEvent,
  ConversationId,
  ConversationNotFound,
  NoAgentProvider,
} from "./conversation.ts";
import { DiskUsage } from "./disk.ts";
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
import { UpdaterState } from "./update.ts";
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
  Rpc.make("ListAgentProviders", {
    success: Schema.Array(AgentProvider),
  }),
  Rpc.make("ListConversations", {
    success: Schema.Array(Conversation),
  }),
  Rpc.make("GetConversation", {
    payload: { conversationId: ConversationId },
    success: ConversationDetail,
    error: ConversationNotFound,
  }),
  Rpc.make("SendMessage", {
    payload: { conversationId: Schema.NullOr(ConversationId), text: Schema.NonEmptyString },
    success: Conversation,
    error: Schema.Union([ConversationNotFound, ConversationBusy, NoAgentProvider]),
  }),
  Rpc.make("WatchConversation", {
    payload: { conversationId: ConversationId },
    success: ConversationEvent,
    error: ConversationNotFound,
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
