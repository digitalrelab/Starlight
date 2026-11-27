import { FileId } from "@starlight/contracts";
import { FactStore, type StoredFact } from "@starlight/core";
import { Array as Arr, Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";
import { batched } from "./batched.ts";

const Row = Schema.Struct({
  file_id: FileId,
  size: Schema.Number,
  modified_at: Schema.Number,
  version: Schema.Number,
  value: Schema.NullOr(Schema.String),
});

const toFact = (row: typeof Row.Type): StoredFact => ({
  fileId: row.file_id,
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
        SELECT f.file_id, f.size, f.modified_at, f.version, f.value
        FROM facts f JOIN file_identities a ON a.id = f.file_id
        WHERE a.source = ${source} AND a.parent = ${directory} AND f.fact = ${fact}
      `,
    });

    const find = SqlSchema.findOneOption({
      Request: Schema.Struct({ fact: Schema.String, fileId: Schema.String }),
      Result: Row,
      execute: ({ fact, fileId }) =>
        sql`SELECT file_id, size, modified_at, version, value FROM facts WHERE fact = ${fact} AND file_id = ${fileId}`,
    });

    return FactStore.of({
      inDirectory: (scope, directory) =>
        inDirectory({ ...scope, directory }).pipe(
          Effect.map((rows) => rows.map(toFact)),
          Effect.orDie,
        ),
      find: (fact, fileId) => find({ fact, fileId }).pipe(Effect.map(Option.map(toFact)), Effect.orDie),
      save: (fact, facts) =>
        inBatches(
          facts,
          (batch) => sql`
            INSERT INTO facts ${sql.insert(
              Arr.map(batch, (stored) => ({
                file_id: stored.fileId,
                fact,
                size: stored.size,
                modified_at: stored.modifiedAt,
                version: stored.version,
                value: stored.value,
              })),
            )}
            ON CONFLICT (file_id, fact) DO UPDATE SET
              size = excluded.size,
              modified_at = excluded.modified_at,
              version = excluded.version,
              value = excluded.value
          `,
        ),
    });
  }),
);
