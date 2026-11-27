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
  "0006_facts": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`
      CREATE TABLE facts (
        source TEXT NOT NULL,
        entry TEXT NOT NULL,
        fact TEXT NOT NULL,
        parent TEXT NOT NULL,
        size INTEGER NOT NULL,
        modified_at REAL NOT NULL,
        version INTEGER NOT NULL,
        value TEXT,
        PRIMARY KEY (source, entry, fact)
      ) WITHOUT ROWID
    `;
    yield* sql`CREATE INDEX facts_by_parent ON facts (source, fact, parent)`;
  }),
  "0007_conversation_models": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`ALTER TABLE conversations ADD COLUMN model TEXT`;
    yield* sql`ALTER TABLE conversations ADD COLUMN effort TEXT`;
  }),
  "0008_chats": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`ALTER TABLE conversations RENAME TO chats`;
    yield* sql`ALTER TABLE conversation_messages RENAME TO chat_messages`;
    yield* sql`ALTER TABLE chat_messages RENAME COLUMN conversation_id TO chat_id`;
    yield* sql`DROP INDEX conversation_messages_by_conversation`;
    yield* sql`CREATE INDEX chat_messages_by_chat ON chat_messages (chat_id, created_at)`;
  }),
  "0009_projects": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`ALTER TABLE workspaces RENAME TO projects`;
    yield* sql`ALTER TABLE projects RENAME COLUMN opened_at TO created_at`;
    yield* sql`ALTER TABLE mounts RENAME COLUMN workspace_id TO project_id`;
  }),
});
