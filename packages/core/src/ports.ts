import type {
  Actor,
  AgentProviderId,
  AgentModel,
  AgentProviderStatus,
  ChatMessage,
  Chat,
  ChatId,
  Dimensions,
  EntryId,
  EntryKind,
  ModelChoice,
  EntryRef,
  Mount,
  SourceError,
  SourceId,
  FileToken,
  FileId,
  Palette,
  PixelSample,
  Property,
  SampleFailed,
  Project,
  ProjectId,
} from "@starlight/contracts";
import { FileVersion } from "@starlight/contracts";
import { Context, Data, type Effect, type Option, type Stream } from "effect";

export interface SourceEntry {
  readonly id: EntryId;
  readonly key: string;
  readonly name: string;
  readonly kind: EntryKind;
  readonly size: number;
  readonly createdAt: number;
  readonly modifiedAt: number;
  readonly hidden: boolean;
}

export const versionOf = ({ modifiedAt, size }: SourceEntry) => FileVersion.make(`${modifiedAt}:${size}`);

export interface IdentifiedEntry extends SourceEntry {
  readonly fileId: FileId;
}

export interface SourceCrumb {
  readonly id: EntryId;
  readonly name: string;
}

export type SourceChange =
  | { readonly _tag: "Changed"; readonly directories: ReadonlyArray<EntryId> }
  | { readonly _tag: "Resync" };

export interface ProbedFacts {
  readonly dimensions: Dimensions;
  readonly duration: number;
}

export interface ProcessedFacts {
  readonly placeholder: string | null;
  readonly palette: Palette;
  readonly traits: ReadonlyArray<Property>;
}

export type Facts = ProbedFacts & ProcessedFacts;

export type FactName = keyof Facts;

export interface Extractor<A> {
  readonly version: number;
  readonly accepts: (entry: SourceEntry) => boolean;
  readonly extract: (entry: SourceEntry) => Effect.Effect<Option.Option<A>>;
}

export type Extractors = { readonly [F in keyof ProbedFacts]: Extractor<ProbedFacts[F]> };

export interface Processor<A> {
  readonly version: number;
  readonly process: (sample: PixelSample) => A;
}

export interface SourceDriver {
  readonly canonicalize: (id: EntryId) => Effect.Effect<EntryId, SourceError>;
  readonly contains: (root: EntryId, id: EntryId) => boolean;
  readonly parent: (id: EntryId) => EntryId;
  readonly trail: (root: EntryId, id: EntryId) => ReadonlyArray<SourceCrumb>;
  readonly stat: (id: EntryId) => Effect.Effect<SourceEntry, SourceError>;
  readonly search: (
    roots: ReadonlyArray<EntryId>,
    query: string,
    limit: number,
  ) => Effect.Effect<ReadonlyArray<SourceEntry>>;
  readonly list: (id: EntryId) => Effect.Effect<ReadonlyArray<SourceEntry>, SourceError>;
  readonly write: (id: EntryId, content: Uint8Array) => Effect.Effect<SourceEntry, SourceError>;
  readonly watch: (root: EntryId) => Stream.Stream<SourceChange, SourceError>;
  readonly extractors: Extractors;
  readonly sample: (entry: SourceEntry) => Effect.Effect<Option.Option<PixelSample>, SampleFailed>;
}

export class SourceDrivers extends Context.Service<SourceDrivers, ReadonlyMap<SourceId, SourceDriver>>()(
  "@starlight/core/SourceDrivers",
) {}

export class FileTokens extends Context.Service<
  FileTokens,
  { readonly issue: (ref: EntryRef, entry: IdentifiedEntry) => FileToken }
>()("@starlight/core/FileTokens") {}

export interface StoredFact {
  readonly fileId: FileId;
  readonly size: number;
  readonly modifiedAt: number;
  readonly version: number;
  readonly value: string | null;
}

export interface FactScope {
  readonly source: SourceId;
  readonly fact: FactName;
}

export class FactStore extends Context.Service<
  FactStore,
  {
    readonly inDirectory: (scope: FactScope, directory: EntryId) => Effect.Effect<ReadonlyArray<StoredFact>>;
    readonly find: (fact: FactName, fileId: FileId) => Effect.Effect<Option.Option<StoredFact>>;
    readonly save: (fact: FactName, facts: ReadonlyArray<StoredFact>) => Effect.Effect<void>;
  }
>()("@starlight/core/FactStore") {}

export interface FileIdentity {
  readonly id: FileId;
  readonly entry: EntryId;
  readonly key: string;
}

export class FileIdentityStore extends Context.Service<
  FileIdentityStore,
  {
    readonly inDirectory: (
      source: SourceId,
      directory: EntryId,
    ) => Effect.Effect<ReadonlyArray<FileIdentity>>;
    readonly withKeys: (
      source: SourceId,
      keys: ReadonlyArray<string>,
    ) => Effect.Effect<ReadonlyArray<FileIdentity>>;
    readonly save: (
      source: SourceId,
      directory: EntryId,
      identities: ReadonlyArray<FileIdentity>,
    ) => Effect.Effect<void>;
  }
>()("@starlight/core/FileIdentityStore") {}

export class ProjectStore extends Context.Service<
  ProjectStore,
  {
    readonly create: (input: {
      readonly name: string;
      readonly mounts: ReadonlyArray<Mount>;
    }) => Effect.Effect<Project>;
    readonly rename: (id: ProjectId, name: string) => Effect.Effect<void>;
    readonly remove: (id: ProjectId) => Effect.Effect<void>;
    readonly addMount: (id: ProjectId, mount: Mount) => Effect.Effect<void>;
    readonly removeMount: (id: ProjectId, root: EntryRef) => Effect.Effect<void>;
    readonly findById: (id: ProjectId) => Effect.Effect<Option.Option<Project>>;
    readonly list: Effect.Effect<ReadonlyArray<Project>>;
  }
>()("@starlight/core/ProjectStore") {}

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

export interface AgentTurnInput {
  readonly prompt: string;
  readonly history: ReadonlyArray<ChatMessage>;
  readonly session: Option.Option<string>;
  readonly model: ModelChoice;
}

export type AgentTurnEvent =
  | { readonly _tag: "TextDelta"; readonly text: string }
  | { readonly _tag: "Completed"; readonly session: Option.Option<string> };

export class AgentTurnFailed extends Data.TaggedError("AgentTurnFailed")<{ readonly message: string }> {
  static from = (cause: unknown) =>
    new AgentTurnFailed({ message: cause instanceof Error ? cause.message : String(cause) });
}

export interface AgentProviderDriver {
  readonly name: string;
  readonly status: Effect.Effect<AgentProviderStatus>;
  readonly models: Effect.Effect<ReadonlyArray<AgentModel>>;
  readonly prepare: Effect.Effect<void>;
  readonly forget: (session: string) => Effect.Effect<void>;
  readonly respond: (input: AgentTurnInput) => Stream.Stream<AgentTurnEvent, AgentTurnFailed>;
}

export class AgentProviderDrivers extends Context.Service<
  AgentProviderDrivers,
  ReadonlyMap<AgentProviderId, AgentProviderDriver>
>()("@starlight/core/AgentProviderDrivers") {}

export interface StoredChat {
  readonly chat: Chat;
  readonly messages: ReadonlyArray<ChatMessage>;
  readonly session: Option.Option<string>;
}

export class ChatStore extends Context.Service<
  ChatStore,
  {
    readonly list: (projectId: ProjectId | null) => Effect.Effect<ReadonlyArray<Chat>>;
    readonly search: (query: string, limit: number) => Effect.Effect<ReadonlyArray<Chat>>;
    readonly find: (id: ChatId) => Effect.Effect<Option.Option<StoredChat>>;
    readonly create: (input: {
      readonly projectId: ProjectId | null;
      readonly model: ModelChoice;
      readonly title: string;
    }) => Effect.Effect<Chat>;
    readonly append: (id: ChatId, message: ChatMessage) => Effect.Effect<void>;
    readonly saveSession: (id: ChatId, session: string) => Effect.Effect<void>;
    readonly saveModel: (id: ChatId, model: ModelChoice) => Effect.Effect<void>;
    readonly rename: (id: ChatId, title: string) => Effect.Effect<void>;
    readonly remove: (id: ChatId) => Effect.Effect<void>;
  }
>()("@starlight/core/ChatStore") {}

export class IdGenerator extends Context.Service<IdGenerator, { readonly next: Effect.Effect<string> }>()(
  "@starlight/core/IdGenerator",
) {}
