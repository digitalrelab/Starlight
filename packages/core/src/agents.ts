import type { AgentProvider, AgentProviderId, AgentProviderUsage } from "@starlight/contracts";
import { Context, Effect, Layer, type Stream } from "effect";
import { Chats } from "./chats.ts";
import { AgentProviderDrivers } from "./ports.ts";

export class AgentProviders extends Context.Service<
  AgentProviders,
  {
    readonly list: Effect.Effect<ReadonlyArray<AgentProvider>>;
    readonly usage: Effect.Effect<ReadonlyArray<AgentProviderUsage>>;
    readonly usageChanges: Stream.Stream<AgentProviderId>;
    readonly prepare: Effect.Effect<void>;
  }
>()("@starlight/core/AgentProviders") {
  static readonly layer = Layer.effect(AgentProviders)(
    Effect.gen(function* () {
      const drivers = yield* AgentProviderDrivers;
      const chats = yield* Chats;
      return AgentProviders.of({
        list: Effect.forEach(
          drivers,
          ([id, driver]) =>
            Effect.gen(function* () {
              const status = yield* driver.status;
              const models = status._tag === "Ready" ? yield* driver.models : [];
              return { id, name: driver.name, status, models };
            }),
          { concurrency: "unbounded" },
        ),
        usage: Effect.forEach(
          drivers,
          ([provider, driver]) => Effect.map(driver.usage, (usage) => ({ provider, usage })),
          {
            concurrency: "unbounded",
          },
        ),
        usageChanges: chats.settledTurns,
        prepare: Effect.forEach(drivers, ([, driver]) => driver.prepare, { discard: true }),
      });
    }),
  );
}
