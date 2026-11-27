import type { AgentProvider } from "@starlight/contracts";
import { Context, Effect, Layer } from "effect";
import { AgentProviderDrivers } from "./ports.ts";

export class AgentProviders extends Context.Service<
  AgentProviders,
  {
    readonly list: Effect.Effect<ReadonlyArray<AgentProvider>>;
    readonly prepare: Effect.Effect<void>;
  }
>()("@starlight/core/AgentProviders") {
  static readonly layer = Layer.effect(AgentProviders)(
    Effect.gen(function* () {
      const drivers = yield* AgentProviderDrivers;
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
        prepare: Effect.forEach(drivers, ([, driver]) => driver.prepare, { discard: true }),
      });
    }),
  );
}
