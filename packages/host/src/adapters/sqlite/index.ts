import { join } from "node:path";
import { SqliteClient, SqliteMigrator } from "@effect/sql-sqlite-node";
import { Layer } from "effect";
import { SqliteAuditLogLive } from "./audit-log.ts";
import { SqliteConversationStoreLive } from "./conversation-store.ts";
import { migrations } from "./migrations.ts";
import { SqliteWorkspaceStoreLive } from "./workspace-store.ts";

export const SqliteLive = (dataDir: string) => {
  const client = SqliteClient.layer({ filename: join(dataDir, "starlight.db") });
  const migrator = SqliteMigrator.layer({ loader: migrations });
  return Layer.mergeAll(SqliteWorkspaceStoreLive, SqliteConversationStoreLive, SqliteAuditLogLive).pipe(
    Layer.provide(migrator),
    Layer.provide(client),
  );
};
