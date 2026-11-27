import { randomUUID } from "node:crypto";
import { AgentProviderId, ChatMessage, type Chat, ChatId, ModelId, ProjectId } from "@starlight/contracts";
import { ChatStore } from "@starlight/core";
import { Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";

const ChatRow = Schema.Struct({
  id: ChatId,
  project_id: Schema.NullOr(ProjectId),
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

const toChat = (row: typeof ChatRow.Type): Chat => ({
  id: row.id,
  projectId: row.project_id,
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

export const SqliteChatStoreLive = Layer.effect(ChatStore)(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    const list = SqlSchema.findAll({
      Request: Schema.NullOr(ProjectId),
      Result: ChatRow,
      execute: (projectId) =>
        sql`SELECT * FROM chats WHERE project_id IS ${projectId} ORDER BY updated_at DESC`,
    });

    const findChat = SqlSchema.findOneOption({
      Request: ChatId,
      Result: ChatRow,
      execute: (id) => sql`SELECT * FROM chats WHERE id = ${id}`,
    });

    const findMessages = SqlSchema.findAll({
      Request: ChatId,
      Result: MessageRow,
      execute: (id) =>
        sql`SELECT id, role, text, created_at FROM chat_messages WHERE chat_id = ${id} ORDER BY created_at`,
    });

    return ChatStore.of({
      list: (projectId) =>
        list(projectId).pipe(
          Effect.map((rows) => rows.map(toChat)),
          Effect.orDie,
        ),
      find: (id) =>
        Effect.gen(function* () {
          const row = yield* findChat(id);
          if (Option.isNone(row)) return Option.none();
          const messages = yield* findMessages(id);
          return Option.some({
            chat: toChat(row.value),
            messages: messages.map(toMessage),
            session: Option.fromNullishOr(row.value.session),
          });
        }).pipe(Effect.orDie),
      create: ({ projectId, model: { provider, model, effort }, title }) =>
        Effect.gen(function* () {
          const now = Date.now();
          const chat: Chat = {
            id: ChatId.make(randomUUID()),
            projectId,
            provider,
            model,
            effort,
            title,
            createdAt: now,
            updatedAt: now,
          };
          yield* sql`
            INSERT INTO chats (id, project_id, provider, model, effort, title, created_at, updated_at)
            VALUES (${chat.id}, ${projectId}, ${provider}, ${model}, ${effort}, ${title}, ${now}, ${now})
          `;
          return chat;
        }).pipe(Effect.orDie),
      append: (id, message) =>
        sql
          .withTransaction(
            Effect.gen(function* () {
              yield* sql`
                INSERT INTO chat_messages (id, chat_id, role, text, created_at)
                VALUES (${message.id}, ${id}, ${message.role}, ${message.text}, ${message.createdAt})
              `;
              yield* sql`UPDATE chats SET updated_at = ${message.createdAt} WHERE id = ${id}`;
            }),
          )
          .pipe(Effect.orDie),
      saveModel: (id, { model, effort }) =>
        sql`UPDATE chats SET model = ${model}, effort = ${effort} WHERE id = ${id}`.pipe(
          Effect.asVoid,
          Effect.orDie,
        ),
      rename: (id, title) =>
        sql`UPDATE chats SET title = ${title} WHERE id = ${id}`.pipe(Effect.asVoid, Effect.orDie),
      remove: (id) =>
        sql
          .withTransaction(
            Effect.gen(function* () {
              yield* sql`DELETE FROM chat_messages WHERE chat_id = ${id}`;
              yield* sql`DELETE FROM chats WHERE id = ${id}`;
            }),
          )
          .pipe(Effect.orDie),
      saveSession: (id, session) =>
        sql`UPDATE chats SET session = ${session} WHERE id = ${id}`.pipe(Effect.asVoid, Effect.orDie),
    });
  }),
);
