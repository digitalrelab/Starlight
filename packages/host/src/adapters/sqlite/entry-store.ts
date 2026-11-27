import { EntryId, EntryKind, FileId, SourceId } from "@starlight/contracts";
import { EntryStore, type StoredEntry } from "@starlight/core";
import { Array as Arr, Effect, Layer, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";
import { BATCH_SIZE, batched } from "./batched.ts";
import { wordsOf } from "./entry-words.ts";

const Row = Schema.Struct({
  id: EntryId,
  key: Schema.String,
  name: Schema.String,
  kind: EntryKind,
  size: Schema.Number,
  created_at: Schema.Number,
  modified_at: Schema.Number,
  hidden: Schema.BooleanFromBit,
  file_id: Schema.NullOr(FileId),
});

const COLUMNS = "id, key, name, kind, size, created_at, modified_at, hidden, file_id";

const toEntry = (row: typeof Row.Type): StoredEntry => ({
  id: row.id,
  key: row.key,
  name: row.name,
  kind: row.kind,
  size: row.size,
  createdAt: row.created_at,
  modifiedAt: row.modified_at,
  hidden: row.hidden,
  fileId: row.file_id,
});

const Found = Schema.Struct({ ...Row.fields, source: SourceId, parent: EntryId });

const Removed = Schema.Struct({ file_id: Schema.NullOr(FileId) });

const TRIGRAM = 3;

const phrase = (words: string) => `"${words.trim().replaceAll('"', '""')}"`;

const successor = (text: string) =>
  text.slice(0, -1) + String.fromCharCode(text.charCodeAt(text.length - 1) + 1);

export const SqliteEntryStoreLive = Layer.effect(EntryStore)(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const inBatches = batched(sql);

    const roots = SqlSchema.findAll({
      Request: Schema.Void,
      Result: Schema.Struct({ source: SourceId, id: EntryId }),
      execute: () => sql`
        SELECT source, parent AS id FROM (SELECT DISTINCT source, parent FROM entries) AS parents
        WHERE NOT EXISTS (SELECT 1 FROM entries WHERE entries.source = parents.source AND entries.id = parents.parent)
      `,
    });

    const children = SqlSchema.findAll({
      Request: Schema.Struct({ source: Schema.String, directory: Schema.String }),
      Result: Row,
      execute: ({ source, directory }) =>
        sql`SELECT ${sql.literal(COLUMNS)} FROM entries WHERE source = ${source} AND parent = ${directory}`,
    });

    const withKeys = SqlSchema.findAll({
      Request: Schema.Struct({ source: Schema.String, keys: Schema.Array(Schema.String) }),
      Result: Row,
      execute: ({ source, keys }) => sql`
        SELECT ${sql.literal(COLUMNS)} FROM entries
        WHERE source = ${source} AND file_id IS NOT NULL AND key IN ${sql.in(keys)}
      `,
    });

    const search = SqlSchema.findAll({
      Request: Schema.Struct({
        words: Schema.String,
        directories: Schema.Boolean,
        hidden: Schema.Boolean,
        limit: Schema.Number,
      }),
      Result: Found,
      execute: ({ words, directories, hidden, limit }) => {
        const filters = sql`${directories ? sql`AND kind = 'directory'` : sql`AND kind != 'directory'`} ${
          hidden ? sql.literal("") : sql`AND concealed = 0`
        }`;
        return words.trim().length >= TRIGRAM
          ? sql`
              SELECT source, parent, ${sql.literal(COLUMNS)} FROM entries
              WHERE rowid IN (SELECT rowid FROM entry_words WHERE entry_words MATCH ${phrase(words)}) ${filters}
              ORDER BY CASE instr(words, ${words}) WHEN 1 THEN 0 WHEN 0 THEN 2 ELSE 1 END, length(name), modified_at DESC
              LIMIT ${limit}
            `
          : sql`
              SELECT source, parent, ${sql.literal(COLUMNS)} FROM entries
              WHERE words >= ${words} AND words < ${successor(words)} ${filters}
              ORDER BY words
              LIMIT ${limit}
            `;
      },
    });

    const remove = SqlSchema.findAll({
      Request: Schema.Struct({
        source: Schema.String,
        ids: Schema.Array(Schema.String),
        keep: Schema.Array(Schema.String),
      }),
      Result: Removed,
      execute: ({ source, ids, keep }) => sql`
        WITH RECURSIVE doomed (id) AS (
          SELECT id FROM entries WHERE source = ${source} AND id IN ${sql.in(ids)}
          UNION
          SELECT entries.id FROM entries JOIN doomed ON entries.parent = doomed.id
          WHERE entries.source = ${source} ${keep.length === 0 ? sql.literal("") : sql`AND doomed.id NOT IN ${sql.in(keep)}`}
        )
        DELETE FROM entries WHERE source = ${source} AND id IN (SELECT id FROM doomed)
        RETURNING file_id
      `,
    });

    return EntryStore.of({
      roots: Effect.orDie(roots(undefined)),
      children: (source, directory) =>
        children({ source, directory }).pipe(
          Effect.map((rows) => rows.map(toEntry)),
          Effect.orDie,
        ),
      withKeys: (source, keys) =>
        Effect.forEach(Arr.chunksOf(keys, BATCH_SIZE), (batch) => withKeys({ source, keys: batch })).pipe(
          Effect.map((found) => found.flat().map(toEntry)),
          Effect.orDie,
        ),
      save: (source, directory, entries) =>
        inBatches(entries, (batch) =>
          Effect.gen(function* () {
            const ids = sql.in(batch.map((entry) => entry.id));
            const fileIds = batch.flatMap((entry) => (entry.fileId ? [entry.fileId] : []));
            if (fileIds.length > 0) {
              yield* sql`DELETE FROM entries WHERE file_id IN ${sql.in(fileIds)} AND NOT (source = ${source} AND id IN ${ids})`;
            }
            const [above] = yield* sql<{ readonly concealed: number }>`
              SELECT concealed FROM entries WHERE source = ${source} AND id = ${directory}
            `;
            const concealed = (entry: StoredEntry) => above?.concealed === 1 || entry.hidden;
            yield* sql`
              INSERT INTO entries ${sql.insert(
                Arr.map(batch, (entry) => ({
                  source,
                  id: entry.id,
                  parent: directory,
                  key: entry.key,
                  name: entry.name,
                  kind: entry.kind,
                  size: entry.size,
                  created_at: entry.createdAt,
                  modified_at: entry.modifiedAt,
                  hidden: entry.hidden ? 1 : 0,
                  concealed: concealed(entry) ? 1 : 0,
                  words: wordsOf(entry.name),
                  file_id: entry.fileId,
                })),
              )}
              ON CONFLICT (source, id) DO UPDATE SET
                parent = excluded.parent,
                key = excluded.key,
                name = excluded.name,
                kind = excluded.kind,
                size = excluded.size,
                created_at = excluded.created_at,
                modified_at = excluded.modified_at,
                hidden = excluded.hidden,
                concealed = excluded.concealed,
                words = excluded.words,
                file_id = COALESCE(entries.file_id, excluded.file_id)
            `;
            const concealing = batch.filter((entry) => entry.kind === "directory" && concealed(entry));
            if (concealing.length > 0) {
              yield* sql`
                WITH RECURSIVE below (id) AS (
                  SELECT id FROM entries WHERE source = ${source} AND parent IN ${sql.in(concealing.map((entry) => entry.id))}
                  UNION
                  SELECT entries.id FROM entries JOIN below ON entries.parent = below.id WHERE entries.source = ${source}
                )
                UPDATE entries SET concealed = 1 WHERE source = ${source} AND id IN (SELECT id FROM below)
              `;
            }
          }),
        ),
      search: ({ text, ...query }) =>
        search({ ...query, words: wordsOf(text) }).pipe(
          Effect.map((rows) =>
            rows.map((row) => ({ ...toEntry(row), source: row.source, parent: row.parent })),
          ),
          Effect.orDie,
        ),
      remove: (source, ids, keep) =>
        sql
          .withTransaction(
            Effect.forEach(Arr.chunksOf(ids, BATCH_SIZE), (batch) => remove({ source, ids: batch, keep })),
          )
          .pipe(
            Effect.map((removed) => removed.flat().flatMap(({ file_id }) => (file_id ? [file_id] : []))),
            Effect.orDie,
          ),
    });
  }),
);
