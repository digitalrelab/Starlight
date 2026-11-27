import type { Actor, EntryKind, FileSystemError, Workspace, WorkspaceId } from "@starlight/contracts";
import { Context, type Effect, type Option } from "effect";

export interface FileStat {
  readonly kind: EntryKind;
  readonly size: number;
  readonly modifiedAt: number;
}

export interface DirectoryEntry extends FileStat {
  readonly name: string;
}

/** Disk access. */
export class FileSystemPort extends Context.Service<
  FileSystemPort,
  {
    readonly realPath: (path: string) => Effect.Effect<string, FileSystemError>;
    readonly stat: (path: string) => Effect.Effect<FileStat, FileSystemError>;
    readonly readDirectory: (path: string) => Effect.Effect<ReadonlyArray<DirectoryEntry>, FileSystemError>;
  }
>()("@starlight/core/FileSystemPort") {}

/** Persistence for known workspaces. Infra failures are defects. */
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

/** Append-only record of mutating commands and who issued them. */
export class AuditLog extends Context.Service<
  AuditLog,
  { readonly record: (entry: AuditRecord) => Effect.Effect<void> }
>()("@starlight/core/AuditLog") {}

/** The actor bound to the current connection. */
export class CurrentActor extends Context.Service<CurrentActor, Actor>()("@starlight/core/CurrentActor") {}
