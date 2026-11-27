import {
  type AgentProviderId,
  type ChatMessage,
  type Draft,
  type Conversation,
  ConversationBusy,
  type ConversationDetail,
  type ConversationEvent,
  type ConversationId,
  ConversationNotFound,
  NoAgentProvider,
} from "@starlight/contracts";
import { Cause, Clock, Context, Effect, FiberSet, Layer, Option, PubSub, Stream } from "effect";
import {
  type AgentProviderDriver,
  AgentProviderDrivers,
  AuditLog,
  ConversationStore,
  CurrentActor,
  IdGenerator,
  type StoredConversation,
} from "./ports.ts";

const TITLE_LENGTH = 80;

const titleFrom = (text: string) => {
  const line = text.trim().split("\n")[0] ?? "";
  return line.length > TITLE_LENGTH ? `${line.slice(0, TITLE_LENGTH - 1)}…` : line;
};

interface Published {
  readonly conversationId: ConversationId;
  readonly event: ConversationEvent;
}

export class Conversations extends Context.Service<
  Conversations,
  {
    readonly list: Effect.Effect<ReadonlyArray<Conversation>>;
    readonly get: (id: ConversationId) => Effect.Effect<ConversationDetail, ConversationNotFound>;
    readonly send: (
      id: ConversationId | null,
      text: string,
    ) => Effect.Effect<Conversation, ConversationNotFound | ConversationBusy | NoAgentProvider, CurrentActor>;
    readonly watch: (id: ConversationId) => Stream.Stream<ConversationEvent, ConversationNotFound>;
  }
>()("@starlight/core/Conversations") {
  static readonly layer = Layer.effect(Conversations)(
    Effect.gen(function* () {
      const store = yield* ConversationStore;
      const drivers = yield* AgentProviderDrivers;
      const audit = yield* AuditLog;
      const ids = yield* IdGenerator;
      const events = yield* PubSub.unbounded<Published>();
      const turns = yield* FiberSet.make();
      const drafts = new Map<ConversationId, Draft>();
      const failures = new Map<ConversationId, string>();

      const publish = (conversationId: ConversationId, event: ConversationEvent) =>
        PubSub.publish(events, { conversationId, event });

      const find = (id: ConversationId) =>
        Effect.flatMap(store.find(id), (found) =>
          Option.isSome(found)
            ? Effect.succeed(found.value)
            : Effect.fail(new ConversationNotFound({ conversationId: id })),
        );

      const firstReadyProvider = Effect.findFirst(drivers, ([, driver]) =>
        Effect.map(driver.status, (status) => status._tag === "Ready"),
      ).pipe(
        Effect.flatMap(Effect.fromOption),
        Effect.mapError(() => new NoAgentProvider()),
      );

      const driverFor = (provider: AgentProviderId) =>
        Effect.fromNullishOr(drivers.get(provider)).pipe(Effect.mapError(() => new NoAgentProvider()));

      const message = (id: string, role: ChatMessage["role"], text: string) =>
        Effect.map(Clock.currentTimeMillis, (createdAt): ChatMessage => ({ id, role, text, createdAt }));

      const failureOf = (cause: Cause.Cause<unknown>) => {
        const error = Cause.squash(cause);
        return error instanceof Error ? error.message : String(error);
      };

      const respond = (
        stored: StoredConversation,
        driver: AgentProviderDriver,
        initial: Draft,
        prompt: string,
      ) => {
        const id = stored.conversation.id;
        return Effect.gen(function* () {
          let draft = initial;
          let session = stored.session;
          yield* driver.respond({ prompt, history: stored.messages, session }).pipe(
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
          drafts.delete(id);
          yield* publish(id, { _tag: "MessageAdded", message: reply });
        }).pipe(
          Effect.catchCause((cause) => {
            if (Cause.hasInterruptsOnly(cause)) return Effect.failCause(cause);
            const message = failureOf(cause);
            failures.set(id, message);
            return publish(id, { _tag: "TurnFailed", message });
          }),
          Effect.ensuring(Effect.sync(() => drafts.delete(id))),
        );
      };

      const begin = (id: ConversationId | null, text: string) =>
        id === null
          ? Effect.gen(function* () {
              const [provider, driver] = yield* firstReadyProvider;
              const conversation = yield* store.create({ provider, title: titleFrom(text) });
              const stored: StoredConversation = { conversation, messages: [], session: Option.none() };
              return [stored, driver] as const;
            })
          : Effect.gen(function* () {
              const stored = yield* find(id);
              return [stored, yield* driverFor(stored.conversation.provider)] as const;
            });

      const get = (id: ConversationId) =>
        Effect.map(find(id), ({ conversation, messages }): ConversationDetail => ({
          conversation,
          messages,
          draft: drafts.get(id) ?? null,
          failure: failures.get(id) ?? null,
        }));

      return Conversations.of({
        list: store.list,
        get,
        send: Effect.fn("Conversations.send")(function* (id, text) {
          const draft: Draft = { id: yield* ids.next, text: "" };
          if (id !== null) {
            if (drafts.has(id)) return yield* new ConversationBusy({ conversationId: id });
            drafts.set(id, draft);
          }
          const release = (conversationId: ConversationId) =>
            Effect.sync(() => drafts.delete(conversationId));
          const [stored, driver] = yield* begin(id, text).pipe(
            Effect.onError(() => (id === null ? Effect.void : release(id))),
          );
          const conversationId = stored.conversation.id;
          drafts.set(conversationId, draft);
          failures.delete(conversationId);
          yield* Effect.gen(function* () {
            const prompt = yield* message(yield* ids.next, "user", text);
            yield* store.append(conversationId, prompt);
            yield* audit.record({
              actor: yield* CurrentActor,
              action: "SendMessage",
              target: conversationId,
            });
            yield* publish(conversationId, { _tag: "MessageAdded", message: prompt });
            yield* publish(conversationId, { _tag: "Draft", draft });
          }).pipe(Effect.onError(() => release(conversationId)));
          yield* FiberSet.run(turns)(respond(stored, driver, draft, text));
          return stored.conversation;
        }),
        watch: (id) =>
          Stream.unwrap(
            Effect.gen(function* () {
              const subscription = yield* PubSub.subscribe(events);
              const detail = yield* get(id);
              return Stream.concat(
                Stream.make({ _tag: "Snapshot", detail } as const),
                Stream.fromSubscription(subscription).pipe(
                  Stream.filter((published) => published.conversationId === id),
                  Stream.map((published) => published.event),
                ),
              );
            }),
          ),
      });
    }),
  );
}
