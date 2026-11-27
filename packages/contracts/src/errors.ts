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
  NotADirectory,
  SourceError,
]);
export type DirectoryError = typeof DirectoryError.Type;
