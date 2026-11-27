import { EntryId, FileId } from "@starlight/contracts";
import { FileIdentityStore, type FileIdentity } from "@starlight/core";
import { Array as Arr, Effect, Layer, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";
import { BATCH_SIZE, batched } from "./batched.ts";

const Row = Schema.Struct({ id: FileId, entry: EntryId, key: Schema.String });

export const SqliteFileIdentityStoreLive = Layer.effect(FileIdentityStore)(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const inBatches = batched(sql);

    const inDirectory = SqlSchema.findAll({
      Request: Schema.Struct({ source: Schema.String, directory: Schema.String }),
      Result: Row,
      execute: ({ source, directory }) =>
        sql`SELECT id, entry, key FROM file_identities WHERE source = ${source} AND parent = ${directory}`,
    });

    const withKeys = SqlSchema.findAll({
      Request: Schema.Struct({ source: Schema.String, keys: Schema.Array(Schema.String) }),
      Result: Row,
      execute: ({ source, keys }) =>
        sql`SELECT id, entry, key FROM file_identities WHERE source = ${source} AND key IN ${sql.in(keys)}`,
    });

    return FileIdentityStore.of({
      inDirectory: (source, directory) => inDirectory({ source, directory }).pipe(Effect.orDie),
      withKeys: (source, keys) =>
        Effect.forEach(Arr.chunksOf(keys, BATCH_SIZE), (batch) => withKeys({ source, keys: batch })).pipe(
          Effect.map((found): ReadonlyArray<FileIdentity> => found.flat()),
          Effect.orDie,
        ),
      save: (source, directory, identities) =>
        inBatches(
          identities,
          (batch) => sql`
            INSERT INTO file_identities ${sql.insert(
              Arr.map(batch, (identity) => ({
                id: identity.id,
                source,
                entry: identity.entry,
                parent: directory,
                key: identity.key,
              })),
            )}
            ON CONFLICT (id) DO UPDATE SET entry = excluded.entry, parent = excluded.parent, key = excluded.key
            ON CONFLICT DO NOTHING
          `,
        ),
    });
  }),
);
