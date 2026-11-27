import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/rpc";
import { AgentProvider, AgentProviderId, AgentProviderUsage, ModelChoice } from "./agent.ts";
import { Chat, ChatBusy, ChatDetail, ChatEvent, ChatId, ChatNotFound, ModelUnavailable } from "./chat.ts";
import { DiskUsage } from "./disk.ts";
import { EntryLocation } from "./reference.ts";
import { CreatableKind, EntryChange, Listing } from "./entry.ts";
import {
  CreateError,
  DirectoryError,
  FileError,
  MountError,
  WriteError,
  SourceError,
  SourceUnavailable,
  ProjectNotFound,
} from "./errors.ts";
import { EntryRef, ProjectId } from "./ids.ts";
import { FileDetails, FileSource, FileVersion, Media, MediaUpdate } from "./media.ts";
import { EntryMatch, ReferenceMatch } from "./search.ts";
import { UpdaterState } from "./update.ts";
import { Project } from "./project.ts";

const DirectoryRequest = { projectId: ProjectId, directory: Schema.NullOr(EntryRef) };

export class HostRpcs extends RpcGroup.make(
  Rpc.make("CreateProject", {
    payload: { root: EntryRef },
    success: Project,
    error: MountError,
  }),
  Rpc.make("ListProjects", {
    success: Schema.Array(Project),
  }),
  Rpc.make("GetProject", {
    payload: { projectId: ProjectId },
    success: Project,
    error: ProjectNotFound,
  }),
  Rpc.make("RenameProject", {
    payload: { projectId: ProjectId, name: Schema.NonEmptyString },
    success: Project,
    error: ProjectNotFound,
  }),
  Rpc.make("DeleteProject", {
    payload: { projectId: ProjectId },
    error: ProjectNotFound,
  }),
  Rpc.make("AddMount", {
    payload: { projectId: ProjectId, root: EntryRef },
    success: Project,
    error: Schema.Union([ProjectNotFound, MountError]),
  }),
  Rpc.make("RemoveMount", {
    payload: { projectId: ProjectId, root: EntryRef },
    success: Project,
    error: ProjectNotFound,
  }),
  Rpc.make("ListEntries", {
    payload: DirectoryRequest,
    success: Listing,
    error: DirectoryError,
  }),
  Rpc.make("CreateEntry", {
    payload: { projectId: ProjectId, directory: EntryRef, name: Schema.NonEmptyString, kind: CreatableKind },
    success: EntryRef,
    error: CreateError,
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
    payload: { projectId: ProjectId, file: EntryRef },
    success: FileSource,
    error: FileError,
  }),
  Rpc.make("SearchReferences", {
    payload: { query: Schema.String, projectId: Schema.NullOr(ProjectId), includeHidden: Schema.Boolean },
    success: Schema.Array(ReferenceMatch),
  }),
  Rpc.make("LocateEntry", {
    payload: { ref: EntryRef },
    success: EntryLocation,
    error: Schema.Union([SourceUnavailable, SourceError]),
  }),
  Rpc.make("SearchEntries", {
    payload: { query: Schema.String, projectId: Schema.NullOr(ProjectId), includeHidden: Schema.Boolean },
    success: Schema.Array(EntryMatch),
  }),
  Rpc.make("GetFileDetails", {
    payload: { projectId: ProjectId, file: EntryRef },
    success: FileDetails,
    error: FileError,
  }),
  Rpc.make("WriteFile", {
    payload: { projectId: ProjectId, file: EntryRef, content: Schema.Uint8Array, base: FileVersion },
    success: FileVersion,
    error: WriteError,
  }),
  Rpc.make("WatchEntries", {
    payload: { projectId: ProjectId },
    success: EntryChange,
    error: Schema.Union([ProjectNotFound, SourceUnavailable, SourceError]),
    stream: true,
  }),
  Rpc.make("ListAgentProviders", {
    success: Schema.Array(AgentProvider),
  }),
  Rpc.make("PrepareAgentProviders"),
  Rpc.make("GetAgentUsage", {
    success: Schema.Array(AgentProviderUsage),
  }),
  Rpc.make("ListChats", {
    payload: { projectId: Schema.NullOr(ProjectId) },
    success: Schema.Array(Chat),
  }),
  Rpc.make("GetChat", {
    payload: { chatId: ChatId },
    success: ChatDetail,
    error: ChatNotFound,
  }),
  Rpc.make("StartChat", {
    payload: {
      projectId: Schema.NullOr(ProjectId),
      text: Schema.NonEmptyString,
      model: ModelChoice,
    },
    success: Chat,
    error: Schema.Union([ProjectNotFound, ModelUnavailable]),
  }),
  Rpc.make("SendMessage", {
    payload: {
      chatId: ChatId,
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
  Rpc.make("WatchSettledTurns", {
    success: AgentProviderId,
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
