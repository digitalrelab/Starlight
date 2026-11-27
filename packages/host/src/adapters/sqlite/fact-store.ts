import { FileId } from "@starlight/contracts";
import { FactStore, type StoredFact } from "@starlight/core";
import { Array as Arr, Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";
import { batched } from "./batched.ts";

const Row = Schema.Struct({
  asset: FileId,
  size: Schema.Number,
  modified_at: Schema.Number,
  version: Schema.Number,
  value: Schema.NullOr(Schema.String),
});

const toFact = (row: typeof Row.Type): StoredFact => ({
  asset: row.asset,
  size: row.size,
  modifiedAt: row.modified_at,
  version: row.version,
  value: row.value,
});

export const SqliteFactStoreLive = Layer.effect(FactStore)(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const inBatches = batched(sql);

    const inDirectory = SqlSchema.findAll({
      Request: Schema.Struct({ source: Schema.String, fact: Schema.String, directory: Schema.String }),
      Result: Row,
      execute: ({ source, fact, directory }) => sql`
        SELECT f.asset, f.size, f.modified_at, f.version, f.value
        FROM facts f JOIN assets a ON a.id = f.asset
        WHERE a.source = ${source} AND a.parent = ${directory} AND f.fact = ${fact}
      `,
    });

    const find = SqlSchema.findOneOption({
      Request: Schema.Struct({ fact: Schema.String, asset: Schema.String }),
      Result: Row,
      execute: ({ fact, asset }) =>
        sql`SELECT asset, size, modified_at, version, value FROM facts WHERE fact = ${fact} AND asset = ${asset}`,
    });

    return FactStore.of({
      inDirectory: (scope, directory) =>
        inDirectory({ ...scope, directory }).pipe(
          Effect.map((rows) => rows.map(toFact)),
          Effect.orDie,
        ),
      find: (fact, asset) => find({ fact, asset }).pipe(Effect.map(Option.map(toFact)), Effect.orDie),
      save: (fact, facts) =>
        inBatches(
          facts,
          (batch) => sql`
            INSERT INTO facts ${sql.insert(
              Arr.map(batch, (stored) => ({
                asset: stored.asset,
                fact,
                size: stored.size,
                modified_at: stored.modifiedAt,
                version: stored.version,
                value: stored.value,
              })),
            )}
            ON CONFLICT (asset, fact) DO UPDATE SET
              size = excluded.size,
              modified_at = excluded.modified_at,
              version = excluded.version,
              value = excluded.value
          `,
        ),
    });
  }),
);
