import { randomUUID } from "node:crypto";
import { Mount, type Workspace, WorkspaceId } from "@starlight/contracts";
import { WorkspaceStore } from "@starlight/core";
import { Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";

const Row = Schema.Struct({
  id: WorkspaceId,
  name: Schema.String,
  created_at: Schema.Number,
  mounts: Schema.fromJsonString(Schema.Array(Mount)),
});

const toWorkspace = (row: typeof Row.Type): Workspace => ({
  id: row.id,
  name: row.name,
  createdAt: row.created_at,
  mounts: row.mounts,
});

export const SqliteWorkspaceStoreLive = Layer.effect(WorkspaceStore)(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    const select = sql`
      SELECT w.id, w.name, w.created_at, (
        SELECT json_group_array(
          json_object('root', json_object('source', m.source, 'id', m.root), 'name', m.name)
          ORDER BY m.position
        )
        FROM mounts m WHERE m.workspace_id = w.id
      ) AS mounts
      FROM workspaces w
    `;

    const byId = (id: string) => sql`${select} WHERE w.id = ${id}`;
    const findById = SqlSchema.findOneOption({ Request: WorkspaceId, Result: Row, execute: byId });
    const findExisting = SqlSchema.findOne({ Request: WorkspaceId, Result: Row, execute: byId });

    const list = SqlSchema.findAll({
      Request: Schema.Void,
      Result: Row,
      execute: () => sql`${select} ORDER BY w.created_at, w.id`,
    });

    const insertMount = (id: WorkspaceId, mount: Mount) => sql`
      INSERT INTO mounts (workspace_id, position, source, root, name)
      VALUES (
        ${id},
        (SELECT coalesce(max(position) + 1, 0) FROM mounts WHERE workspace_id = ${id}),
        ${mount.root.source},
        ${mount.root.id},
        ${mount.name}
      )
      ON CONFLICT DO NOTHING
    `;

    return WorkspaceStore.of({
      create: ({ name, mounts }) => {
        const id = WorkspaceId.make(randomUUID());
        return sql
          .withTransaction(
            Effect.gen(function* () {
              yield* sql`INSERT INTO workspaces (id, name, created_at) VALUES (${id}, ${name}, ${Date.now()})`;
              for (const mount of mounts) yield* insertMount(id, mount);
              return yield* findExisting(id);
            }),
          )
          .pipe(Effect.map(toWorkspace), Effect.orDie);
      },
      rename: (id, name) =>
        sql`UPDATE workspaces SET name = ${name} WHERE id = ${id}`.pipe(Effect.asVoid, Effect.orDie),
      remove: (id) =>
        sql
          .withTransaction(
            Effect.gen(function* () {
              yield* sql`DELETE FROM mounts WHERE workspace_id = ${id}`;
              yield* sql`DELETE FROM workspaces WHERE id = ${id}`;
            }),
          )
          .pipe(Effect.orDie),
      addMount: (id, mount) => insertMount(id, mount).pipe(Effect.asVoid, Effect.orDie),
      removeMount: (id, root) =>
        sql`DELETE FROM mounts WHERE workspace_id = ${id} AND source = ${root.source} AND root = ${root.id}`.pipe(
          Effect.asVoid,
          Effect.orDie,
        ),
      findById: (id) => findById(id).pipe(Effect.map(Option.map(toWorkspace)), Effect.orDie),
      list: list(undefined).pipe(
        Effect.map((rows) => rows.map(toWorkspace)),
        Effect.orDie,
      ),
    });
  }),
);
