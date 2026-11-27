import { IgnorePattern } from "@starlight/contracts";
import { IgnoreStore } from "@starlight/core";
import { Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";

const KEY = "ignore-patterns";

const Patterns = Schema.fromJsonString(Schema.Array(IgnorePattern));

export const SqliteIgnoreStoreLive = Layer.effect(IgnoreStore)(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    const load = SqlSchema.findOneOption({
      Request: Schema.Void,
      Result: Schema.Struct({ value: Patterns }),
      execute: () => sql`SELECT value FROM settings WHERE key = ${KEY}`,
    });

    return IgnoreStore.of({
      load: load(undefined).pipe(Effect.map(Option.map(({ value }) => value)), Effect.orDie),
      save: (patterns) =>
        sql`
          INSERT INTO settings ${sql.insert({ key: KEY, value: Schema.encodeSync(Patterns)(patterns) })}
          ON CONFLICT (key) DO UPDATE SET value = excluded.value
        `.pipe(Effect.asVoid, Effect.orDie),
    });
  }),
);
