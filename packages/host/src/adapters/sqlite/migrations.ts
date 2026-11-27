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
  "0004_mounts": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`ALTER TABLE workspaces RENAME TO legacy_workspaces`;
    yield* sql`
      CREATE TABLE workspaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        opened_at INTEGER NOT NULL
      )
    `;
    yield* sql`
      CREATE TABLE mounts (
        workspace_id TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        source TEXT NOT NULL,
        root TEXT NOT NULL,
        name TEXT NOT NULL,
        PRIMARY KEY (workspace_id, source, root)
      )
    `;
    yield* sql`INSERT INTO workspaces (id, name, opened_at) SELECT id, name, opened_at FROM legacy_workspaces`;
    yield* sql`
      INSERT INTO mounts (workspace_id, position, source, root, name)
      SELECT id, 0, 'local', root_path, name FROM legacy_workspaces
    `;
    yield* sql`DROP TABLE legacy_workspaces`;
  }),
  "0005_conversations": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`
      CREATE TABLE conversations (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        title TEXT NOT NULL,
        session TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;
    yield* sql`
      CREATE TABLE conversation_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `;
    yield* sql`CREATE INDEX conversation_messages_by_conversation ON conversation_messages (conversation_id, created_at)`;
  }),
  "0006_conversation_models": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`ALTER TABLE conversations ADD COLUMN model TEXT`;
    yield* sql`ALTER TABLE conversations ADD COLUMN effort TEXT`;
  }),
});
