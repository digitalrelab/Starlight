import type { AgentProvider } from "@starlight/contracts";
import { Context, Effect, Layer } from "effect";
import { AgentProviderDrivers } from "./ports.ts";

export class AgentProviders extends Context.Service<
  AgentProviders,
  { readonly list: Effect.Effect<ReadonlyArray<AgentProvider>> }
>()("@starlight/core/AgentProviders") {
  static readonly layer = Layer.effect(AgentProviders)(
    Effect.gen(function* () {
      const drivers = yield* AgentProviderDrivers;
      return AgentProviders.of({
        list: Effect.forEach(
          drivers,
          ([id, driver]) => Effect.map(driver.status, (status) => ({ id, name: driver.name, status })),
          { concurrency: "unbounded" },
        ),
      });
    }),
  );
}
