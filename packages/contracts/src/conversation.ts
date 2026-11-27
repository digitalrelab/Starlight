import { Schema } from "effect";
import { AgentProviderId } from "./agent.ts";

export const ConversationId = Schema.String.pipe(Schema.brand("ConversationId"));
export type ConversationId = typeof ConversationId.Type;

export const Conversation = Schema.Struct({
  id: ConversationId,
  provider: AgentProviderId,
  title: Schema.String,
  createdAt: Schema.Number,
  updatedAt: Schema.Number,
});
export type Conversation = typeof Conversation.Type;

export const ChatMessage = Schema.Struct({
  id: Schema.String,
  role: Schema.Literals(["user", "assistant"]),
  text: Schema.String,
  createdAt: Schema.Number,
});
export type ChatMessage = typeof ChatMessage.Type;

export const Draft = Schema.Struct({ id: Schema.String, text: Schema.String });
export type Draft = typeof Draft.Type;

export const ConversationDetail = Schema.Struct({
  conversation: Conversation,
  messages: Schema.Array(ChatMessage),
  draft: Schema.NullOr(Draft),
  failure: Schema.NullOr(Schema.String),
});
export type ConversationDetail = typeof ConversationDetail.Type;

export const ConversationEvent = Schema.Union([
  Schema.TaggedStruct("Snapshot", { detail: ConversationDetail }),
  Schema.TaggedStruct("Draft", { draft: Draft }),
  Schema.TaggedStruct("MessageAdded", { message: ChatMessage }),
  Schema.TaggedStruct("TurnFailed", { message: Schema.String }),
]);
export type ConversationEvent = typeof ConversationEvent.Type;

export class ConversationNotFound extends Schema.TaggedError<ConversationNotFound>()("ConversationNotFound", {
  conversationId: ConversationId,
}) {
  override get message() {
    return `Conversation not found: ${this.conversationId}`;
  }
}

export class ConversationBusy extends Schema.TaggedError<ConversationBusy>()("ConversationBusy", {
  conversationId: ConversationId,
}) {
  override get message() {
    return "The agent is still replying in this conversation.";
  }
}

export class NoAgentProvider extends Schema.TaggedError<NoAgentProvider>()("NoAgentProvider", {}) {
  override get message() {
    return "No agent is connected. Set one up in Settings → Connections.";
  }
}
