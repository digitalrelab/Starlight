import { Schema } from "effect";
import { EntryRef, SourceId, WorkspaceId } from "./ids.ts";

export class WorkspaceNotFound extends Schema.TaggedError<WorkspaceNotFound>()("WorkspaceNotFound", {
  workspaceId: WorkspaceId,
}) {
  override get message() {
    return `Workspace not found: ${this.workspaceId}`;
  }
}

export class SourceUnavailable extends Schema.TaggedError<SourceUnavailable>()("SourceUnavailable", {
  source: SourceId,
}) {
  override get message() {
    return `Source unavailable: ${this.source}`;
  }
}

export class OutsideWorkspace extends Schema.TaggedError<OutsideWorkspace>()("OutsideWorkspace", {
  entry: EntryRef,
}) {
  override get message() {
    return `Outside the workspace: ${this.entry.id}`;
  }
}

export class NotADirectory extends Schema.TaggedError<NotADirectory>()("NotADirectory", {
  entry: EntryRef,
}) {
  override get message() {
    return `Not a directory: ${this.entry.id}`;
  }
}

export class NotAFile extends Schema.TaggedError<NotAFile>()("NotAFile", {
  entry: EntryRef,
}) {
  override get message() {
    return `Not a file: ${this.entry.id}`;
  }
}

export class DirectoryMissing extends Schema.TaggedError<DirectoryMissing>()("DirectoryMissing", {
  entry: EntryRef,
  nearest: Schema.NullOr(EntryRef),
}) {
  override get message() {
    return `Directory not found: ${this.entry.id}`;
  }
}

export class SourceError extends Schema.TaggedError<SourceError>()("SourceError", {
  entry: EntryRef,
  reason: Schema.Literals(["NotFound", "PermissionDenied", "Unknown"]),
  message: Schema.String,
}) {}

export const MountError = Schema.Union([SourceUnavailable, NotADirectory, SourceError]);
export type MountError = typeof MountError.Type;

export const DirectoryError = Schema.Union([
  WorkspaceNotFound,
  SourceUnavailable,
  OutsideWorkspace,
  DirectoryMissing,
  SourceError,
]);
export type DirectoryError = typeof DirectoryError.Type;

export class VersionConflict extends Schema.TaggedError<VersionConflict>()("VersionConflict", {
  entry: EntryRef,
}) {
  override get message() {
    return `Changed since it was read: ${this.entry.id}`;
  }
}

export const FileError = Schema.Union([
  WorkspaceNotFound,
  SourceUnavailable,
  OutsideWorkspace,
  NotAFile,
  SourceError,
]);
export type FileError = typeof FileError.Type;

export const WriteError = Schema.Union([...FileError.members, VersionConflict]);
export type WriteError = typeof WriteError.Type;
