import { SqliteClient, SqliteMigrator } from "@effect/sql-sqlite-node";
import { Layer } from "effect";
import { SqliteAuditLogLive } from "./audit-log.ts";
import { SqliteChatStoreLive } from "./chat-store.ts";
import { SqliteFileIdentityStoreLive } from "./file-identity-store.ts";
import { SqliteFactStoreLive } from "./fact-store.ts";
import { migrations } from "./migrations.ts";
import { SqliteProjectStoreLive } from "./project-store.ts";

export const SqliteLive = (filename: string) => {
  const client = SqliteClient.layer({ filename });
  const migrator = SqliteMigrator.layer({ loader: migrations });
  return Layer.mergeAll(
    SqliteProjectStoreLive,
    SqliteChatStoreLive,
    SqliteFactStoreLive,
    SqliteFileIdentityStoreLive,
    SqliteAuditLogLive,
  ).pipe(Layer.provide(migrator), Layer.provide(client));
};
