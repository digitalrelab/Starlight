import { defaultSettings, type Settings as SettingsValue, type SettingsPatch } from "@starlight/contracts";
import { Context, Effect, Layer } from "effect";
import { AuditLog, CurrentActor, SettingsStore } from "./ports.ts";

const withDefaults = (stored: SettingsPatch): SettingsValue => ({ ...defaultSettings, ...stored });

export class Settings extends Context.Service<
  Settings,
  {
    readonly get: Effect.Effect<SettingsValue>;
    readonly update: (patch: SettingsPatch) => Effect.Effect<SettingsValue, never, CurrentActor>;
  }
>()("@starlight/core/Settings") {
  static readonly layer = Layer.effect(Settings)(
    Effect.gen(function* () {
      const store = yield* SettingsStore;
      const audit = yield* AuditLog;

      return Settings.of({
        get: store.read.pipe(Effect.map(withDefaults)),
        update: Effect.fn("Settings.update")(function* (patch) {
          const stored = yield* store.merge(patch);
          yield* audit.record({
            actor: yield* CurrentActor,
            action: "UpdateSettings",
            target: JSON.stringify(patch),
          });
          return withDefaults(stored);
        }),
      });
    }),
  );
}
