import {
  type AgentProviderId,
  type Conversation,
  ConversationBusy,
  type ConversationDetail,
  type ConversationEvent,
  type ConversationId,
  ConversationNotFound,
  NoAgentProvider,
} from "@starlight/contracts";
import { Cause, Context, Effect, FiberSet, Layer, Option, PubSub, Stream } from "effect";
import {
  type AgentProviderDriver,
  AgentProviderDrivers,
  AuditLog,
  ConversationStore,
  CurrentActor,
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
    readonly watch: (id: ConversationId) => Stream.Stream<ConversationEvent>;
  }
>()("@starlight/core/Conversations") {
  static readonly layer = Layer.effect(Conversations)(
    Effect.gen(function* () {
      const store = yield* ConversationStore;
      const drivers = yield* AgentProviderDrivers;
      const audit = yield* AuditLog;
      const events = yield* PubSub.unbounded<Published>();
      const turns = yield* FiberSet.make();
      const drafts = new Map<ConversationId, string>();
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

      const failureOf = (cause: Cause.Cause<unknown>) => {
        const error = Cause.squash(cause);
        return error instanceof Error ? error.message : String(error);
      };

      const respond = (stored: StoredConversation, driver: AgentProviderDriver, prompt: string) => {
        const id = stored.conversation.id;
        return Effect.gen(function* () {
          let session = stored.session;
          yield* driver.respond({ prompt, history: stored.messages, session }).pipe(
            Stream.runForEach((event) => {
              if (event._tag === "Completed") {
                session = event.session;
                return Effect.void;
              }
              const text = (drafts.get(id) ?? "") + event.text;
              drafts.set(id, text);
              return publish(id, { _tag: "Draft", text });
            }),
          );
          if (Option.isSome(session)) yield* store.saveSession(id, session.value);
          const message = yield* store.append(id, { role: "assistant", text: drafts.get(id) ?? "" });
          yield* publish(id, { _tag: "MessageAdded", message });
          yield* publish(id, { _tag: "TurnFinished" });
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

      return Conversations.of({
        list: store.list,
        get: (id) =>
          Effect.map(find(id), ({ conversation, messages }) => ({
            conversation,
            messages,
            draft: drafts.get(id) ?? null,
            failure: failures.get(id) ?? null,
          })),
        send: Effect.fn("Conversations.send")(function* (id, text) {
          if (id !== null) {
            if (drafts.has(id)) return yield* new ConversationBusy({ conversationId: id });
            drafts.set(id, "");
          }
          const release = (conversationId: ConversationId | null) =>
            Effect.sync(() => conversationId !== null && drafts.delete(conversationId));
          const [stored, driver] = yield* begin(id, text).pipe(Effect.onError(() => release(id)));
          const conversationId = stored.conversation.id;
          drafts.set(conversationId, "");
          failures.delete(conversationId);
          yield* Effect.gen(function* () {
            const message = yield* store.append(conversationId, { role: "user", text });
            yield* audit.record({
              actor: yield* CurrentActor,
              action: "SendMessage",
              target: conversationId,
            });
            yield* publish(conversationId, { _tag: "MessageAdded", message });
            yield* publish(conversationId, { _tag: "Draft", text: "" });
          }).pipe(Effect.onError(() => release(conversationId)));
          yield* FiberSet.run(turns)(respond(stored, driver, text));
          return stored.conversation;
        }),
        watch: (id) =>
          Stream.unwrap(
            Effect.map(PubSub.subscribe(events), (subscription) => {
              const draft = drafts.get(id);
              const live = Stream.fromSubscription(subscription).pipe(
                Stream.filter((published) => published.conversationId === id),
                Stream.map((published) => published.event),
              );
              return draft === undefined
                ? live
                : Stream.concat(Stream.make({ _tag: "Draft", text: draft } as const), live);
            }),
          ),
      });
    }),
  );
}
