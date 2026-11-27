import { SqliteClient, SqliteMigrator } from "@effect/sql-sqlite-node";
import { Layer } from "effect";
import { SqliteAuditLogLive } from "./audit-log.ts";
import { migrations } from "./migrations.ts";
import { SqliteWorkspaceStoreLive } from "./workspace-store.ts";

export const SqliteLive = (filename: string) => {
  const client = SqliteClient.layer({ filename });
  const migrator = SqliteMigrator.layer({ loader: migrations });
  return Layer.mergeAll(SqliteWorkspaceStoreLive, SqliteAuditLogLive).pipe(
    Layer.provide(migrator),
    Layer.provide(client),
  );
};
