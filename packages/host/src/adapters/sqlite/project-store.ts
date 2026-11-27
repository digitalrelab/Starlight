import { randomUUID } from "node:crypto";
import { Mount, type Project, ProjectId } from "@starlight/contracts";
import { ProjectStore } from "@starlight/core";
import { Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";

const Row = Schema.Struct({
  id: ProjectId,
  name: Schema.String,
  created_at: Schema.Number,
  mounts: Schema.fromJsonString(Schema.Array(Mount)),
});

const toProject = (row: typeof Row.Type): Project => ({
  id: row.id,
  name: row.name,
  createdAt: row.created_at,
  mounts: row.mounts,
});

export const SqliteProjectStoreLive = Layer.effect(ProjectStore)(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    const select = sql`
      SELECT p.id, p.name, p.created_at, (
        SELECT json_group_array(
          json_object('root', json_object('source', m.source, 'id', m.root), 'name', m.name)
          ORDER BY m.position
        )
        FROM mounts m WHERE m.project_id = p.id
      ) AS mounts
      FROM projects p
    `;

    const byId = (id: string) => sql`${select} WHERE p.id = ${id}`;
    const findById = SqlSchema.findOneOption({ Request: ProjectId, Result: Row, execute: byId });
    const findExisting = SqlSchema.findOne({ Request: ProjectId, Result: Row, execute: byId });

    const list = SqlSchema.findAll({
      Request: Schema.Void,
      Result: Row,
      execute: () => sql`${select} ORDER BY p.created_at, p.id`,
    });

    const insertMount = (id: ProjectId, mount: Mount) => sql`
      INSERT INTO mounts (project_id, position, source, root, name)
      VALUES (
        ${id},
        (SELECT coalesce(max(position) + 1, 0) FROM mounts WHERE project_id = ${id}),
        ${mount.root.source},
        ${mount.root.id},
        ${mount.name}
      )
      ON CONFLICT DO NOTHING
    `;

    return ProjectStore.of({
      create: ({ name, mounts }) => {
        const id = ProjectId.make(randomUUID());
        return sql
          .withTransaction(
            Effect.gen(function* () {
              yield* sql`INSERT INTO projects (id, name, created_at) VALUES (${id}, ${name}, ${Date.now()})`;
              for (const mount of mounts) yield* insertMount(id, mount);
              return yield* findExisting(id);
            }),
          )
          .pipe(Effect.map(toProject), Effect.orDie);
      },
      rename: (id, name) =>
        sql`UPDATE projects SET name = ${name} WHERE id = ${id}`.pipe(Effect.asVoid, Effect.orDie),
      remove: (id) =>
        sql
          .withTransaction(
            Effect.gen(function* () {
              yield* sql`DELETE FROM mounts WHERE project_id = ${id}`;
              yield* sql`DELETE FROM projects WHERE id = ${id}`;
            }),
          )
          .pipe(Effect.orDie),
      addMount: (id, mount) => insertMount(id, mount).pipe(Effect.asVoid, Effect.orDie),
      removeMount: (id, root) =>
        sql`DELETE FROM mounts WHERE project_id = ${id} AND source = ${root.source} AND root = ${root.id}`.pipe(
          Effect.asVoid,
          Effect.orDie,
        ),
      findById: (id) => findById(id).pipe(Effect.map(Option.map(toProject)), Effect.orDie),
      list: list(undefined).pipe(
        Effect.map((rows) => rows.map(toProject)),
        Effect.orDie,
      ),
    });
  }),
);
