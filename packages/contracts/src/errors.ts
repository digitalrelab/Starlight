import { Schema } from "effect";
import { WorkspaceId } from "./ids.ts";

export class WorkspaceNotFound extends Schema.TaggedError<WorkspaceNotFound>()("WorkspaceNotFound", {
  workspaceId: WorkspaceId,
}) {}

export class PathOutsideWorkspace extends Schema.TaggedError<PathOutsideWorkspace>()("PathOutsideWorkspace", {
  path: Schema.String,
}) {}

export class NotADirectory extends Schema.TaggedError<NotADirectory>()("NotADirectory", {
  path: Schema.String,
}) {}

export class FileSystemError extends Schema.TaggedError<FileSystemError>()("FileSystemError", {
  path: Schema.String,
  reason: Schema.Literals(["NotFound", "PermissionDenied", "Unknown"]),
  message: Schema.String,
}) {}
