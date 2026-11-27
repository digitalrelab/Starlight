import { randomUUID } from "node:crypto";
import { EntryRef, Mount, type Workspace, WorkspaceId } from "@starlight/contracts";
import { WorkspaceStore } from "@starlight/core";
import { Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";

const Row = Schema.Struct({
  id: WorkspaceId,
  name: Schema.String,
  opened_at: Schema.Number,
  mounts: Schema.fromJsonString(Schema.Array(Mount)),
});

const toWorkspace = (row: typeof Row.Type): Workspace => ({
  id: row.id,
  name: row.name,
  openedAt: row.opened_at,
  mounts: row.mounts,
});

export const SqliteWorkspaceStoreLive = Layer.effect(WorkspaceStore)(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    const select = sql`
      SELECT w.id, w.name, w.opened_at, (
        SELECT json_group_array(
          json_object('root', json_object('source', m.source, 'id', m.root), 'name', m.name)
          ORDER BY m.position
        )
        FROM mounts m WHERE m.workspace_id = w.id
      ) AS mounts
      FROM workspaces w
    `;

    const findById = SqlSchema.findOneOption({
      Request: WorkspaceId,
      Result: Row,
      execute: (id) => sql`${select} WHERE w.id = ${id}`,
    });

    const findExisting = SqlSchema.findOne({
      Request: WorkspaceId,
      Result: Row,
      execute: (id) => sql`${select} WHERE w.id = ${id}`,
    });

    const findBySoleMount = SqlSchema.findOneOption({
      Request: EntryRef,
      Result: Row,
      execute: (root) => sql`
        ${select}
        WHERE (SELECT count(*) FROM mounts m WHERE m.workspace_id = w.id) = 1
          AND EXISTS (
            SELECT 1 FROM mounts m
            WHERE m.workspace_id = w.id AND m.source = ${root.source} AND m.root = ${root.id}
          )
      `,
    });

    const recent = SqlSchema.findAll({
      Request: Schema.Number,
      Result: Row,
      execute: (limit) => sql`${select} ORDER BY w.opened_at DESC LIMIT ${limit}`,
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
              yield* sql`INSERT INTO workspaces (id, name, opened_at) VALUES (${id}, ${name}, ${Date.now()})`;
              for (const mount of mounts) yield* insertMount(id, mount);
              return yield* findExisting(id);
            }),
          )
          .pipe(Effect.map(toWorkspace), Effect.orDie);
      },
      addMount: (id, mount) => insertMount(id, mount).pipe(Effect.asVoid, Effect.orDie),
      touch: (id) =>
        sql`UPDATE workspaces SET opened_at = ${Date.now()} WHERE id = ${id}`.pipe(
          Effect.andThen(findExisting(id)),
          Effect.map(toWorkspace),
          Effect.orDie,
        ),
      findById: (id) => findById(id).pipe(Effect.map(Option.map(toWorkspace)), Effect.orDie),
      findBySoleMount: (root) =>
        findBySoleMount(root).pipe(Effect.map(Option.map(toWorkspace)), Effect.orDie),
      recent: (limit) =>
        recent(limit).pipe(
          Effect.map((rows) => rows.map(toWorkspace)),
          Effect.orDie,
        ),
    });
  }),
);
