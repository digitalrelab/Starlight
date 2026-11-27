import type {
  Actor,
  AgentProviderId,
  AgentProviderStatus,
  ChatMessage,
  Conversation,
  ConversationId,
  Dimensions,
  EntryId,
  EntryKind,
  EntryRef,
  Mount,
  SourceError,
  SourceId,
  FileToken,
  Workspace,
  WorkspaceId,
} from "@starlight/contracts";
import { Context, Data, type Effect, type Option, type Stream } from "effect";

export interface SourceEntry {
  readonly id: EntryId;
  readonly name: string;
  readonly kind: EntryKind;
  readonly size: number;
  readonly modifiedAt: number;
  readonly hidden: boolean;
}

export interface SourceCrumb {
  readonly id: EntryId;
  readonly name: string;
}

export type SourceChange =
  | { readonly _tag: "Changed"; readonly directories: ReadonlyArray<EntryId> }
  | { readonly _tag: "Resync" };

export interface SourceDriver {
  readonly canonicalize: (id: EntryId) => Effect.Effect<EntryId, SourceError>;
  readonly contains: (root: EntryId, id: EntryId) => boolean;
  readonly trail: (root: EntryId, id: EntryId) => ReadonlyArray<SourceCrumb>;
  readonly stat: (id: EntryId) => Effect.Effect<SourceEntry, SourceError>;
  readonly list: (id: EntryId) => Effect.Effect<ReadonlyArray<SourceEntry>, SourceError>;
  readonly watch: (root: EntryId) => Stream.Stream<SourceChange, SourceError>;
  readonly dimensions: (entry: SourceEntry) => Effect.Effect<Option.Option<Dimensions>>;
}

export class SourceDrivers extends Context.Service<SourceDrivers, ReadonlyMap<SourceId, SourceDriver>>()(
  "@starlight/core/SourceDrivers",
) {}

export class FileTokens extends Context.Service<
  FileTokens,
  { readonly issue: (ref: EntryRef, version: number) => FileToken }
>()("@starlight/core/FileTokens") {}

export class WorkspaceStore extends Context.Service<
  WorkspaceStore,
  {
    readonly create: (input: {
      readonly name: string;
      readonly mounts: ReadonlyArray<Mount>;
    }) => Effect.Effect<Workspace>;
    readonly addMount: (id: WorkspaceId, mount: Mount) => Effect.Effect<void>;
    readonly touch: (id: WorkspaceId) => Effect.Effect<Workspace>;
    readonly findById: (id: WorkspaceId) => Effect.Effect<Option.Option<Workspace>>;
    readonly findBySoleMount: (root: EntryRef) => Effect.Effect<Option.Option<Workspace>>;
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

export interface AgentTurnInput {
  readonly prompt: string;
  readonly history: ReadonlyArray<ChatMessage>;
  readonly session: Option.Option<string>;
}

export type AgentTurnEvent =
  | { readonly _tag: "TextDelta"; readonly text: string }
  | { readonly _tag: "Completed"; readonly session: Option.Option<string> };

export class AgentTurnFailed extends Data.TaggedError("AgentTurnFailed")<{ readonly message: string }> {}

export interface AgentProviderDriver {
  readonly name: string;
  readonly status: Effect.Effect<AgentProviderStatus>;
  readonly respond: (input: AgentTurnInput) => Stream.Stream<AgentTurnEvent, AgentTurnFailed>;
}

export class AgentProviderDrivers extends Context.Service<
  AgentProviderDrivers,
  ReadonlyMap<AgentProviderId, AgentProviderDriver>
>()("@starlight/core/AgentProviderDrivers") {}

export interface StoredConversation {
  readonly conversation: Conversation;
  readonly messages: ReadonlyArray<ChatMessage>;
  readonly session: Option.Option<string>;
}

export class ConversationStore extends Context.Service<
  ConversationStore,
  {
    readonly list: Effect.Effect<ReadonlyArray<Conversation>>;
    readonly find: (id: ConversationId) => Effect.Effect<Option.Option<StoredConversation>>;
    readonly create: (input: Pick<Conversation, "provider" | "title">) => Effect.Effect<Conversation>;
    readonly append: (id: ConversationId, message: ChatMessage) => Effect.Effect<void>;
    readonly saveSession: (id: ConversationId, session: string) => Effect.Effect<void>;
  }
>()("@starlight/core/ConversationStore") {}

export class IdGenerator extends Context.Service<IdGenerator, { readonly next: Effect.Effect<string> }>()(
  "@starlight/core/IdGenerator",
) {}
