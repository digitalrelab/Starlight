import { Effect } from "effect";
import { Migrator, SqlClient } from "effect/sql";
import { wordsOf } from "./entry-words.ts";

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
  "0009_file_identities": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`
      CREATE TABLE file_identities (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        entry TEXT NOT NULL,
        parent TEXT NOT NULL,
        key TEXT NOT NULL,
        UNIQUE (source, entry)
      )
    `;
    yield* sql`CREATE INDEX file_identities_by_parent ON file_identities (source, parent)`;
    yield* sql`CREATE INDEX file_identities_by_key ON file_identities (source, key)`;
    yield* sql`DROP TABLE facts`;
    yield* sql`
      CREATE TABLE facts (
        file_id TEXT NOT NULL,
        fact TEXT NOT NULL,
        size INTEGER NOT NULL,
        modified_at REAL NOT NULL,
        version INTEGER NOT NULL,
        value TEXT,
        PRIMARY KEY (file_id, fact)
      ) WITHOUT ROWID
    `;
  }),
  "0010_projects": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`ALTER TABLE workspaces RENAME TO projects`;
    yield* sql`ALTER TABLE projects RENAME COLUMN opened_at TO created_at`;
    yield* sql`ALTER TABLE mounts RENAME COLUMN workspace_id TO project_id`;
  }),
  "0011_project_chats": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`ALTER TABLE chats ADD COLUMN project_id TEXT REFERENCES projects (id) ON DELETE SET NULL`;
    yield* sql`CREATE INDEX chats_by_project ON chats (project_id, updated_at)`;
  }),
  "0012_entries": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`
      CREATE TABLE entries (
        source TEXT NOT NULL,
        id TEXT NOT NULL,
        parent TEXT NOT NULL,
        key TEXT NOT NULL,
        name TEXT NOT NULL,
        kind TEXT NOT NULL,
        size INTEGER NOT NULL,
        created_at REAL NOT NULL,
        modified_at REAL NOT NULL,
        hidden INTEGER NOT NULL,
        file_id TEXT UNIQUE,
        PRIMARY KEY (source, id)
      )
    `;
    yield* sql`CREATE INDEX entries_by_parent ON entries (source, parent)`;
    yield* sql`CREATE INDEX entries_by_key ON entries (source, key) WHERE file_id IS NOT NULL`;
    yield* sql`
      INSERT INTO entries (source, id, parent, key, name, kind, size, created_at, modified_at, hidden, file_id)
      SELECT source, entry, parent, key, '', 'file', -1, -1, -1, 0, id FROM file_identities
    `;
    yield* sql`DROP TABLE file_identities`;
  }),
  "0013_entry_search": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`ALTER TABLE entries ADD COLUMN concealed INTEGER NOT NULL DEFAULT 0`;
    yield* sql`
      WITH RECURSIVE below (source, id) AS (
        SELECT source, id FROM entries WHERE hidden = 1
        UNION
        SELECT entries.source, entries.id FROM entries JOIN below ON entries.source = below.source AND entries.parent = below.id
      )
      UPDATE entries SET concealed = 1 WHERE (source, id) IN (SELECT source, id FROM below)
    `;
    yield* sql`ALTER TABLE entries ADD COLUMN words TEXT NOT NULL DEFAULT ''`;
    const named = yield* sql<{
      readonly rowid: number;
      readonly name: string;
    }>`SELECT rowid, name FROM entries`;
    yield* Effect.forEach(
      named,
      ({ rowid, name }) => sql`UPDATE entries SET words = ${wordsOf(name)} WHERE rowid = ${rowid}`,
      { discard: true },
    );
    yield* sql`CREATE INDEX entries_by_words ON entries (words)`;
    yield* sql`
      CREATE VIRTUAL TABLE entry_words USING fts5 (words, content = 'entries', content_rowid = 'rowid', tokenize = 'trigram')
    `;
    yield* sql`INSERT INTO entry_words (entry_words) VALUES ('rebuild')`;
    yield* sql`
      CREATE TRIGGER entries_inserted AFTER INSERT ON entries BEGIN
        INSERT INTO entry_words (rowid, words) VALUES (new.rowid, new.words);
      END
    `;
    yield* sql`
      CREATE TRIGGER entries_deleted AFTER DELETE ON entries BEGIN
        INSERT INTO entry_words (entry_words, rowid, words) VALUES ('delete', old.rowid, old.words);
      END
    `;
    yield* sql`
      CREATE TRIGGER entries_renamed AFTER UPDATE OF words ON entries WHEN old.words IS NOT new.words BEGIN
        INSERT INTO entry_words (entry_words, rowid, words) VALUES ('delete', old.rowid, old.words);
        INSERT INTO entry_words (rowid, words) VALUES (new.rowid, new.words);
      END
    `;
  }),
  "0014_usage_samples": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`
      CREATE TABLE usage_samples (
        at INTEGER NOT NULL,
        provider TEXT NOT NULL,
        label TEXT NOT NULL,
        used_percent REAL NOT NULL,
        resets_at INTEGER NOT NULL,
        duration_ms INTEGER NOT NULL
      )
    `;
    yield* sql`CREATE INDEX usage_samples_by_window ON usage_samples (resets_at, provider, label, at)`;
    yield* sql`CREATE INDEX usage_samples_by_age ON usage_samples (at)`;
  }),
});
