import type {
  Actor,
  EntryKind,
  FileSystemError,
  SettingsPatch,
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

export class SettingsStore extends Context.Service<
  SettingsStore,
  {
    readonly read: Effect.Effect<SettingsPatch>;
    readonly merge: (patch: SettingsPatch) => Effect.Effect<SettingsPatch>;
  }
>()("@starlight/core/SettingsStore") {}

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
