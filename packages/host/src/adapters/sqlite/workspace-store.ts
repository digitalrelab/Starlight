import { randomUUID } from "node:crypto";
import { type Workspace, WorkspaceId } from "@starlight/contracts";
import { WorkspaceStore } from "@starlight/core";
import { Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";

const Row = Schema.Struct({
  id: WorkspaceId,
  root_path: Schema.String,
  name: Schema.String,
  opened_at: Schema.Number,
});

const toWorkspace = (row: typeof Row.Type): Workspace => ({
  id: row.id,
  rootPath: row.root_path,
  name: row.name,
  openedAt: row.opened_at,
});

export const SqliteWorkspaceStoreLive = Layer.effect(WorkspaceStore)(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    const upsert = SqlSchema.findOne({
      Request: Schema.Struct({
        id: Schema.String,
        rootPath: Schema.String,
        name: Schema.String,
        openedAt: Schema.Number,
      }),
      Result: Row,
      execute: (r) => sql`
        INSERT INTO workspaces (id, root_path, name, opened_at)
        VALUES (${r.id}, ${r.rootPath}, ${r.name}, ${r.openedAt})
        ON CONFLICT (root_path) DO UPDATE SET opened_at = excluded.opened_at, name = excluded.name
        RETURNING *
      `,
    });

    const findById = SqlSchema.findOneOption({
      Request: WorkspaceId,
      Result: Row,
      execute: (id) => sql`SELECT * FROM workspaces WHERE id = ${id}`,
    });

    const recent = SqlSchema.findAll({
      Request: Schema.Number,
      Result: Row,
      execute: (limit) => sql`SELECT * FROM workspaces ORDER BY opened_at DESC LIMIT ${limit}`,
    });

    return WorkspaceStore.of({
      upsert: ({ rootPath, name }) =>
        upsert({ id: randomUUID(), rootPath, name, openedAt: Date.now() }).pipe(
          Effect.map(toWorkspace),
          Effect.orDie,
        ),
      findById: (id) =>
        findById(id).pipe(
          Effect.map((row) => row.pipe(Option.map(toWorkspace))),
          Effect.orDie,
        ),
      recent: (limit) =>
        recent(limit).pipe(
          Effect.map((rows) => rows.map(toWorkspace)),
          Effect.orDie,
        ),
    });
  }),
);
