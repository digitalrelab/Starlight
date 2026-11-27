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
import { Context, Effect, FiberSet, Layer, Option, PubSub, Stream } from "effect";
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

      const respond = (stored: StoredConversation, driver: AgentProviderDriver, prompt: string) => {
        const id = stored.conversation.id;
        return Effect.gen(function* () {
          drafts.set(id, "");
          yield* publish(id, { _tag: "Draft", text: "" });
          let session = stored.session;
          yield* driver.respond({ prompt, history: stored.messages, session: stored.session }).pipe(
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
          Effect.catch((error) => publish(id, { _tag: "TurnFailed", message: error.message })),
          Effect.ensuring(Effect.sync(() => drafts.delete(id))),
        );
      };

      return Conversations.of({
        list: store.list,
        get: (id) =>
          Effect.map(find(id), ({ conversation, messages }) => ({
            conversation,
            messages,
            draft: drafts.get(id) ?? null,
          })),
        send: Effect.fn("Conversations.send")(function* (id, text) {
          if (id !== null && drafts.has(id)) return yield* new ConversationBusy({ conversationId: id });
          const [stored, driver] =
            id === null
              ? yield* Effect.gen(function* () {
                  const [provider, driver] = yield* firstReadyProvider;
                  const conversation = yield* store.create({ provider, title: titleFrom(text) });
                  return [{ conversation, messages: [], session: Option.none() }, driver] as const;
                })
              : yield* Effect.gen(function* () {
                  const stored = yield* find(id);
                  return [stored, yield* driverFor(stored.conversation.provider)] as const;
                });
          const conversation = stored.conversation;
          const message = yield* store.append(conversation.id, { role: "user", text });
          yield* audit.record({ actor: yield* CurrentActor, action: "SendMessage", target: conversation.id });
          drafts.set(conversation.id, "");
          yield* publish(conversation.id, { _tag: "MessageAdded", message });
          yield* FiberSet.run(turns)(respond(stored, driver, text));
          return conversation;
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
