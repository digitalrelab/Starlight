import { Schema } from "effect";
import { WorkspaceId } from "./ids.ts";

export class WorkspaceNotFound extends Schema.TaggedError<WorkspaceNotFound>()("WorkspaceNotFound", {
  workspaceId: WorkspaceId,
}) {
  override get message() {
    return `Workspace not found: ${this.workspaceId}`;
  }
}

export class PathOutsideWorkspace extends Schema.TaggedError<PathOutsideWorkspace>()("PathOutsideWorkspace", {
  path: Schema.String,
}) {
  override get message() {
    return `Path is outside the workspace: ${this.path}`;
  }
}

export class NotADirectory extends Schema.TaggedError<NotADirectory>()("NotADirectory", {
  path: Schema.String,
}) {
  override get message() {
    return `Not a directory: ${this.path}`;
  }
}

export class FileSystemError extends Schema.TaggedError<FileSystemError>()("FileSystemError", {
  path: Schema.String,
  reason: Schema.Literals(["NotFound", "PermissionDenied", "Unknown"]),
  message: Schema.String,
}) {}
