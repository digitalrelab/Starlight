import { EntryId } from "@starlight/contracts";
import { FactStore, type FactScope, type StoredFact } from "@starlight/core";
import { Array as Arr, Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";

const BATCH_SIZE = 500;

const Row = Schema.Struct({
  entry: EntryId,
  size: Schema.Number,
  modified_at: Schema.Number,
  version: Schema.Number,
  value: Schema.NullOr(Schema.String),
});

const toFact = (row: typeof Row.Type): StoredFact => ({
  entry: row.entry,
  size: row.size,
  modifiedAt: row.modified_at,
  version: row.version,
  value: row.value,
});

export const SqliteFactStoreLive = Layer.effect(FactStore)(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const columns = sql`entry, size, modified_at, version, value`;

    const inDirectory = SqlSchema.findAll({
      Request: Schema.Struct({ source: Schema.String, fact: Schema.String, directory: Schema.String }),
      Result: Row,
      execute: ({ source, fact, directory }) =>
        sql`SELECT ${columns} FROM facts WHERE source = ${source} AND fact = ${fact} AND parent = ${directory}`,
    });

    const find = SqlSchema.findOneOption({
      Request: Schema.Struct({ source: Schema.String, fact: Schema.String, entry: Schema.String }),
      Result: Row,
      execute: ({ source, fact, entry }) =>
        sql`SELECT ${columns} FROM facts WHERE source = ${source} AND fact = ${fact} AND entry = ${entry}`,
    });

    const batched = <A>(
      items: ReadonlyArray<A>,
      run: (batch: Arr.NonEmptyReadonlyArray<A>) => Effect.Effect<unknown, unknown>,
    ) =>
      sql
        .withTransaction(Effect.forEach(Arr.chunksOf(items, BATCH_SIZE), run, { discard: true }))
        .pipe(Effect.orDie);

    return FactStore.of({
      inDirectory: (scope, directory) =>
        inDirectory({ ...scope, directory }).pipe(
          Effect.map((rows) => rows.map(toFact)),
          Effect.orDie,
        ),
      find: (scope, entry) => find({ ...scope, entry }).pipe(Effect.map(Option.map(toFact)), Effect.orDie),
      save: ({ source, fact }: FactScope, directory, facts) =>
        batched(
          facts,
          (batch) => sql`
            INSERT INTO facts ${sql.insert(
              Arr.map(batch, (stored) => ({
                source,
                entry: stored.entry,
                fact,
                parent: directory,
                size: stored.size,
                modified_at: stored.modifiedAt,
                version: stored.version,
                value: stored.value,
              })),
            )}
            ON CONFLICT (source, entry, fact) DO UPDATE SET
              parent = excluded.parent,
              size = excluded.size,
              modified_at = excluded.modified_at,
              version = excluded.version,
              value = excluded.value
          `,
        ),
      forget: ({ source, fact }, entries) =>
        batched(
          entries,
          (batch) =>
            sql`DELETE FROM facts WHERE source = ${source} AND fact = ${fact} AND entry IN ${sql.in(batch)}`,
        ),
    });
  }),
);
