import {
  type ChatMessage,
  type Draft,
  type Chat,
  ChatBusy,
  type ChatDetail,
  type ChatEvent,
  type ChatId,
  ChatNotFound,
  type ModelChoice,
  ModelUnavailable,
} from "@starlight/contracts";
import { Cause, Clock, Context, Effect, FiberMap, Layer, Option, PubSub, Stream } from "effect";
import {
  type AgentProviderDriver,
  AgentProviderDrivers,
  AuditLog,
  ChatStore,
  CurrentActor,
  IdGenerator,
  type StoredChat,
} from "./ports.ts";

const TITLE_LENGTH = 80;

const titleFrom = (text: string) => {
  const line = text.trim().split("\n")[0] ?? "";
  return line.length > TITLE_LENGTH ? `${line.slice(0, TITLE_LENGTH - 1)}…` : line;
};

interface Published {
  readonly chatId: ChatId;
  readonly event: ChatEvent;
}

export class Chats extends Context.Service<
  Chats,
  {
    readonly list: Effect.Effect<ReadonlyArray<Chat>>;
    readonly get: (id: ChatId) => Effect.Effect<ChatDetail, ChatNotFound>;
    readonly send: (
      id: ChatId | null,
      text: string,
      model: ModelChoice,
    ) => Effect.Effect<Chat, ChatNotFound | ChatBusy | ModelUnavailable, CurrentActor>;
    readonly rename: (id: ChatId, title: string) => Effect.Effect<Chat, ChatNotFound, CurrentActor>;
    readonly remove: (id: ChatId) => Effect.Effect<void, ChatNotFound, CurrentActor>;
    readonly watch: (id: ChatId) => Stream.Stream<ChatEvent, ChatNotFound>;
  }
>()("@starlight/core/Chats") {
  static readonly layer = Layer.effect(Chats)(
    Effect.gen(function* () {
      const store = yield* ChatStore;
      const drivers = yield* AgentProviderDrivers;
      const audit = yield* AuditLog;
      const ids = yield* IdGenerator;
      const events = yield* PubSub.unbounded<Published>();
      const turns = yield* FiberMap.make<ChatId>();
      const drafts = new Map<ChatId, Draft>();
      const failures = new Map<ChatId, string>();

      const publish = (chatId: ChatId, event: ChatEvent) => PubSub.publish(events, { chatId, event });

      const find = (id: ChatId) =>
        Effect.flatMap(store.find(id), (found) =>
          Option.isSome(found) ? Effect.succeed(found.value) : Effect.fail(new ChatNotFound({ chatId: id })),
        );

      const driverFor = ({ provider }: ModelChoice) =>
        Effect.fromNullishOr(drivers.get(provider)).pipe(
          Effect.mapError(() => new ModelUnavailable({ provider })),
        );

      const message = (id: string, role: ChatMessage["role"], text: string) =>
        Effect.map(Clock.currentTimeMillis, (createdAt): ChatMessage => ({ id, role, text, createdAt }));

      const failureOf = (cause: Cause.Cause<unknown>) => {
        const error = Cause.squash(cause);
        return error instanceof Error ? error.message : String(error);
      };

      const respond = (
        stored: StoredChat,
        driver: AgentProviderDriver,
        initial: Draft,
        prompt: string,
        model: ModelChoice,
      ) => {
        const id = stored.chat.id;
        const settle = (event: ChatEvent) =>
          Effect.suspend(() => {
            drafts.delete(id);
            return publish(id, event);
          });
        return Effect.gen(function* () {
          let draft = initial;
          let session = stored.session;
          yield* driver.respond({ prompt, history: stored.messages, session, model }).pipe(
            Stream.runForEach((event) => {
              if (event._tag === "Completed") {
                session = event.session;
                return Effect.void;
              }
              draft = { id: draft.id, text: draft.text + event.text };
              drafts.set(id, draft);
              return publish(id, { _tag: "Draft", draft });
            }),
          );
          if (Option.isSome(session)) yield* store.saveSession(id, session.value);
          const reply = yield* message(draft.id, "assistant", draft.text);
          yield* store.append(id, reply);
          yield* settle({ _tag: "MessageAdded", message: reply });
        }).pipe(
          Effect.catchCause((cause) => {
            if (Cause.hasInterruptsOnly(cause)) return Effect.failCause(cause);
            const message = failureOf(cause);
            failures.set(id, message);
            return settle({ _tag: "TurnFailed", message });
          }),
        );
      };

      const begin = (id: ChatId | null, text: string, model: ModelChoice) =>
        id === null
          ? Effect.gen(function* () {
              const driver = yield* driverFor(model);
              const chat = yield* store.create({ model, title: titleFrom(text) });
              const stored: StoredChat = { chat, messages: [], session: Option.none() };
              return [stored, driver] as const;
            })
          : Effect.gen(function* () {
              const stored = yield* find(id);
              if (stored.chat.provider !== model.provider) {
                return yield* new ModelUnavailable({ provider: model.provider });
              }
              yield* store.saveModel(id, model);
              return [stored, yield* driverFor(model)] as const;
            });

      const get = (id: ChatId) =>
        Effect.map(find(id), ({ chat, messages }): ChatDetail => ({
          chat,
          messages,
          draft: drafts.get(id) ?? null,
          failure: failures.get(id) ?? null,
        }));

      return Chats.of({
        list: store.list,
        get,
        send: Effect.fn("Chats.send")(function* (id, text, model) {
          const draft: Draft = { id: yield* ids.next, text: "" };
          if (id !== null) {
            if (drafts.has(id)) return yield* new ChatBusy({ chatId: id });
            drafts.set(id, draft);
          }
          const release = (chatId: ChatId) => Effect.sync(() => drafts.delete(chatId));
          const [stored, driver] = yield* begin(id, text, model).pipe(
            Effect.onError(() => (id === null ? Effect.void : release(id))),
          );
          const chatId = stored.chat.id;
          drafts.set(chatId, draft);
          failures.delete(chatId);
          yield* Effect.gen(function* () {
            const prompt = yield* message(yield* ids.next, "user", text);
            yield* store.append(chatId, prompt);
            yield* audit.record({
              actor: yield* CurrentActor,
              action: "SendMessage",
              target: chatId,
            });
            yield* publish(chatId, { _tag: "MessageAdded", message: prompt });
            yield* publish(chatId, { _tag: "Draft", draft });
          }).pipe(Effect.onError(() => release(chatId)));
          yield* FiberMap.run(turns, chatId, respond(stored, driver, draft, text, model));
          return { ...stored.chat, model: model.model, effort: model.effort };
        }),
        rename: Effect.fn("Chats.rename")(function* (id, title) {
          const { chat } = yield* find(id);
          yield* store.rename(id, title);
          yield* audit.record({ actor: yield* CurrentActor, action: "RenameChat", target: id });
          return { ...chat, title };
        }),
        remove: Effect.fn("Chats.remove")(function* (id) {
          const { chat, session } = yield* find(id);
          yield* FiberMap.remove(turns, id);
          drafts.delete(id);
          failures.delete(id);
          yield* store.remove(id);
          const driver = drivers.get(chat.provider);
          if (driver && Option.isSome(session)) yield* driver.forget(session.value);
          yield* audit.record({ actor: yield* CurrentActor, action: "DeleteChat", target: id });
        }),
        watch: (id) =>
          Stream.unwrap(
            Effect.gen(function* () {
              const subscription = yield* PubSub.subscribe(events);
              const detail = yield* get(id);
              return Stream.concat(
                Stream.make({ _tag: "Snapshot", detail } as const),
                Stream.fromSubscription(subscription).pipe(
                  Stream.filter((published) => published.chatId === id),
                  Stream.map((published) => published.event),
                ),
              );
            }),
          ),
      });
    }),
  );
}
