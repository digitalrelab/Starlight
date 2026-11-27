import { randomUUID } from "node:crypto";
import {
  AgentProviderId,
  ChatMessage,
  type Conversation,
  ConversationId,
  ModelId,
} from "@starlight/contracts";
import { ConversationStore } from "@starlight/core";
import { Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";

const ConversationRow = Schema.Struct({
  id: ConversationId,
  provider: AgentProviderId,
  model: Schema.NullOr(ModelId),
  effort: Schema.NullOr(Schema.String),
  title: Schema.String,
  session: Schema.NullOr(Schema.String),
  created_at: Schema.Number,
  updated_at: Schema.Number,
});

const MessageRow = Schema.Struct({
  id: Schema.String,
  role: ChatMessage.fields.role,
  text: Schema.String,
  created_at: Schema.Number,
});

const toConversation = (row: typeof ConversationRow.Type): Conversation => ({
  id: row.id,
  provider: row.provider,
  model: row.model,
  effort: row.effort,
  title: row.title,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toMessage = (row: typeof MessageRow.Type): ChatMessage => ({
  id: row.id,
  role: row.role,
  text: row.text,
  createdAt: row.created_at,
});

export const SqliteConversationStoreLive = Layer.effect(ConversationStore)(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    const list = SqlSchema.findAll({
      Request: Schema.Void,
      Result: ConversationRow,
      execute: () => sql`SELECT * FROM conversations ORDER BY updated_at DESC`,
    });

    const findConversation = SqlSchema.findOneOption({
      Request: ConversationId,
      Result: ConversationRow,
      execute: (id) => sql`SELECT * FROM conversations WHERE id = ${id}`,
    });

    const findMessages = SqlSchema.findAll({
      Request: ConversationId,
      Result: MessageRow,
      execute: (id) =>
        sql`SELECT id, role, text, created_at FROM conversation_messages WHERE conversation_id = ${id} ORDER BY created_at`,
    });

    return ConversationStore.of({
      list: list(undefined).pipe(
        Effect.map((rows) => rows.map(toConversation)),
        Effect.orDie,
      ),
      find: (id) =>
        Effect.gen(function* () {
          const row = yield* findConversation(id);
          if (Option.isNone(row)) return Option.none();
          const messages = yield* findMessages(id);
          return Option.some({
            conversation: toConversation(row.value),
            messages: messages.map(toMessage),
            session: Option.fromNullishOr(row.value.session),
          });
        }).pipe(Effect.orDie),
      create: ({ model: { provider, model, effort }, title }) =>
        Effect.gen(function* () {
          const now = Date.now();
          const conversation: Conversation = {
            id: ConversationId.make(randomUUID()),
            provider,
            model,
            effort,
            title,
            createdAt: now,
            updatedAt: now,
          };
          yield* sql`
            INSERT INTO conversations (id, provider, model, effort, title, created_at, updated_at)
            VALUES (${conversation.id}, ${provider}, ${model}, ${effort}, ${title}, ${now}, ${now})
          `;
          return conversation;
        }).pipe(Effect.orDie),
      append: (id, message) =>
        sql
          .withTransaction(
            Effect.gen(function* () {
              yield* sql`
                INSERT INTO conversation_messages (id, conversation_id, role, text, created_at)
                VALUES (${message.id}, ${id}, ${message.role}, ${message.text}, ${message.createdAt})
              `;
              yield* sql`UPDATE conversations SET updated_at = ${message.createdAt} WHERE id = ${id}`;
            }),
          )
          .pipe(Effect.orDie),
      saveModel: (id, { model, effort }) =>
        sql`UPDATE conversations SET model = ${model}, effort = ${effort} WHERE id = ${id}`.pipe(
          Effect.asVoid,
          Effect.orDie,
        ),
      rename: (id, title) =>
        sql`UPDATE conversations SET title = ${title} WHERE id = ${id}`.pipe(Effect.asVoid, Effect.orDie),
      remove: (id) =>
        sql
          .withTransaction(
            Effect.gen(function* () {
              yield* sql`DELETE FROM conversation_messages WHERE conversation_id = ${id}`;
              yield* sql`DELETE FROM conversations WHERE id = ${id}`;
            }),
          )
          .pipe(Effect.orDie),
      saveSession: (id, session) =>
        sql`UPDATE conversations SET session = ${session} WHERE id = ${id}`.pipe(Effect.asVoid, Effect.orDie),
    });
  }),
);
