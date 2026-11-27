import { Schema } from "effect";
import { AgentProviderId, ModelId } from "./agent.ts";
import { ProjectId } from "./ids.ts";

export const ChatId = Schema.String.pipe(Schema.brand("ChatId"));
export type ChatId = typeof ChatId.Type;

export const Chat = Schema.Struct({
  id: ChatId,
  projectId: Schema.NullOr(ProjectId),
  provider: AgentProviderId,
  model: Schema.NullOr(ModelId),
  effort: Schema.NullOr(Schema.String),
  title: Schema.String,
  createdAt: Schema.Number,
  updatedAt: Schema.Number,
});
export type Chat = typeof Chat.Type;

export const ChatMessage = Schema.Struct({
  id: Schema.String,
  role: Schema.Literals(["user", "assistant"]),
  text: Schema.String,
  createdAt: Schema.Number,
});
export type ChatMessage = typeof ChatMessage.Type;

export const Draft = Schema.Struct({ id: Schema.String, text: Schema.String });
export type Draft = typeof Draft.Type;

export const ChatDetail = Schema.Struct({
  chat: Chat,
  messages: Schema.Array(ChatMessage),
  draft: Schema.NullOr(Draft),
  failure: Schema.NullOr(Schema.String),
});
export type ChatDetail = typeof ChatDetail.Type;

export const ChatEvent = Schema.Union([
  Schema.TaggedStruct("Snapshot", { detail: ChatDetail }),
  Schema.TaggedStruct("Draft", { draft: Draft }),
  Schema.TaggedStruct("MessageAdded", { message: ChatMessage }),
  Schema.TaggedStruct("TurnFailed", { message: Schema.String }),
]);
export type ChatEvent = typeof ChatEvent.Type;

export class ChatNotFound extends Schema.TaggedError<ChatNotFound>()("ChatNotFound", {
  chatId: ChatId,
}) {
  override get message() {
    return `Chat not found: ${this.chatId}`;
  }
}

export class ChatBusy extends Schema.TaggedError<ChatBusy>()("ChatBusy", {
  chatId: ChatId,
}) {
  override get message() {
    return "The agent is still replying in this chat.";
  }
}

export class ModelUnavailable extends Schema.TaggedError<ModelUnavailable>()("ModelUnavailable", {
  provider: AgentProviderId,
}) {
  override get message() {
    return "This model isn't available here. Check Settings › Providers, or start a new chat.";
  }
}
