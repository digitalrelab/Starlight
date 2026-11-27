import type {
  Actor,
  EntryKind,
  FileSystemError,
  ThumbnailToken,
  Workspace,
  WorkspaceId,
} from "@starlight/contracts";
import { Context, type Effect, type Option } from "effect";

export interface FileStat {
  readonly kind: EntryKind;
  readonly size: number;
  readonly modifiedAt: number;
}

export interface DirectoryEntry extends FileStat {
  readonly name: string;
}

export class FileSystemPort extends Context.Service<
  FileSystemPort,
  {
    readonly realPath: (path: string) => Effect.Effect<string, FileSystemError>;
    readonly stat: (path: string) => Effect.Effect<FileStat, FileSystemError>;
    readonly readDirectory: (path: string) => Effect.Effect<ReadonlyArray<DirectoryEntry>, FileSystemError>;
  }
>()("@starlight/core/FileSystemPort") {}

export interface Dimensions {
  readonly width: number;
  readonly height: number;
}

export interface ProbeTarget {
  readonly absolute: string;
  readonly size: number;
  readonly modifiedAt: number;
}

export class MediaProbe extends Context.Service<
  MediaProbe,
  { readonly dimensions: (target: ProbeTarget) => Effect.Effect<Option.Option<Dimensions>> }
>()("@starlight/core/MediaProbe") {}

export class ThumbnailTokens extends Context.Service<
  ThumbnailTokens,
  { readonly issue: (absolute: string, version: number) => ThumbnailToken }
>()("@starlight/core/ThumbnailTokens") {}

export class WorkspaceStore extends Context.Service<
  WorkspaceStore,
  {
    readonly upsert: (input: {
      readonly rootPath: string;
      readonly name: string;
    }) => Effect.Effect<Workspace>;
    readonly findById: (id: WorkspaceId) => Effect.Effect<Option.Option<Workspace>>;
    readonly recent: (limit: number) => Effect.Effect<ReadonlyArray<Workspace>>;
  }
>()("@starlight/core/WorkspaceStore") {}

export interface AuditRecord {
  readonly actor: Actor;
  readonly action: string;
  readonly target: string;
}

export class AuditLog extends Context.Service<
  AuditLog,
  { readonly record: (entry: AuditRecord) => Effect.Effect<void> }
>()("@starlight/core/AuditLog") {}

export class CurrentActor extends Context.Service<CurrentActor, Actor>()("@starlight/core/CurrentActor") {}
