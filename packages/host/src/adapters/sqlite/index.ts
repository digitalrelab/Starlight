import { SqliteClient, SqliteMigrator } from "@effect/sql-sqlite-node";
import { Layer } from "effect";
import { SqliteAuditLogLive } from "./audit-log.ts";
import { SqliteChatStoreLive } from "./chat-store.ts";
import { SqliteAssetStoreLive } from "./asset-store.ts";
import { SqliteFactStoreLive } from "./fact-store.ts";
import { migrations } from "./migrations.ts";
import { SqliteWorkspaceStoreLive } from "./workspace-store.ts";

export const SqliteLive = (filename: string) => {
  const client = SqliteClient.layer({ filename });
  const migrator = SqliteMigrator.layer({ loader: migrations });
  return Layer.mergeAll(
    SqliteWorkspaceStoreLive,
    SqliteChatStoreLive,
    SqliteFactStoreLive,
    SqliteAssetStoreLive,
    SqliteAuditLogLive,
  ).pipe(Layer.provide(migrator), Layer.provide(client));
};
