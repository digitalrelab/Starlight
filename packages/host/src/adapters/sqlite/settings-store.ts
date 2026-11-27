import { SettingsPatch } from "@starlight/contracts";
import { SettingsStore } from "@starlight/core";
import { Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";

const StoredSettings = Schema.fromJsonString(SettingsPatch);
const Row = Schema.Struct({ value: StoredSettings });

export const SqliteSettingsStoreLive = Layer.effect(SettingsStore)(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    const read = SqlSchema.findOneOption({
      Request: Schema.Void,
      Result: Row,
      execute: () => sql`SELECT value FROM settings WHERE id = 1`,
    });

    const merge = SqlSchema.findOne({
      Request: StoredSettings,
      Result: Row,
      execute: (patch) => sql`
        INSERT INTO settings (id, value) VALUES (1, ${patch})
        ON CONFLICT (id) DO UPDATE SET value = json_patch(value, excluded.value)
        RETURNING value
      `,
    });

    return SettingsStore.of({
      read: read(undefined).pipe(
        Effect.map(Option.match({ onNone: () => ({}), onSome: (row) => row.value })),
        Effect.orDie,
      ),
      merge: (patch) =>
        merge(patch).pipe(
          Effect.map((row) => row.value),
          Effect.orDie,
        ),
    });
  }),
);
