import { Schema } from "effect";
import { EntryRef, ProjectId, SourceId } from "./ids.ts";

export class ProjectNotFound extends Schema.TaggedError<ProjectNotFound>()("ProjectNotFound", {
  projectId: ProjectId,
}) {
  override get message() {
    return `Project not found: ${this.projectId}`;
  }
}

export class SourceUnavailable extends Schema.TaggedError<SourceUnavailable>()("SourceUnavailable", {
  source: SourceId,
}) {
  override get message() {
    return `Source unavailable: ${this.source}`;
  }
}

export class OutsideProject extends Schema.TaggedError<OutsideProject>()("OutsideProject", {
  entry: EntryRef,
}) {
  override get message() {
    return `Outside the project: ${this.entry.id}`;
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
  reason: Schema.Literals(["NotFound", "AlreadyExists", "PermissionDenied", "Unknown"]),
  message: Schema.String,
}) {}

export const MountError = Schema.Union([SourceUnavailable, NotADirectory, SourceError]);
export type MountError = typeof MountError.Type;

export const DirectoryError = Schema.Union([
  ProjectNotFound,
  SourceUnavailable,
  OutsideProject,
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
  ProjectNotFound,
  SourceUnavailable,
  OutsideProject,
  NotAFile,
  SourceError,
]);
export type FileError = typeof FileError.Type;

export const WriteError = Schema.Union([...FileError.members, VersionConflict]);
export type WriteError = typeof WriteError.Type;

export class InvalidName extends Schema.TaggedError<InvalidName>()("InvalidName", {
  name: Schema.String,
}) {
  override get message() {
    return `Not a valid name: ${this.name}`;
  }
}

export class EntryExists extends Schema.TaggedError<EntryExists>()("EntryExists", {
  name: Schema.String,
}) {
  override get message() {
    return `Already exists: ${this.name}`;
  }
}

export const NamingError = Schema.Union([...DirectoryError.members, InvalidName, EntryExists]);
export type NamingError = typeof NamingError.Type;
