import { Effect } from "effect";
import { Migrator, SqlClient } from "effect/sql";

export const migrations = Migrator.fromRecord({
  "0001_init": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`
      CREATE TABLE workspaces (
        id TEXT PRIMARY KEY,
        root_path TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        opened_at INTEGER NOT NULL
      )
    `;
    yield* sql`
      CREATE TABLE audit_log (
        id INTEGER PRIMARY KEY,
        at INTEGER NOT NULL,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        target TEXT NOT NULL
      )
    `;
  }),
  "0002_settings": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`
      CREATE TABLE settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        value TEXT NOT NULL
      )
    `;
  }),
  "0003_drop_settings": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`DROP TABLE settings`;
  }),
});
