import { AuditLog } from "@starlight/core";
import { Effect, Layer } from "effect";
import { SqlClient } from "effect/sql";

export const SqliteAuditLogLive = Layer.effect(AuditLog)(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    return AuditLog.of({
      record: ({ actor, action, target }) =>
        sql`
          INSERT INTO audit_log (at, actor, action, target)
          VALUES (${Date.now()}, ${JSON.stringify(actor)}, ${action}, ${target})
        `.pipe(Effect.asVoid, Effect.orDie),
    });
  }),
);
