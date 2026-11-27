import { Array as Arr, Effect } from "effect";
import type { SqlClient } from "effect/sql";

export const BATCH_SIZE = 500;

export const batched =
  (sql: SqlClient.SqlClient) =>
  <A>(
    items: ReadonlyArray<A>,
    run: (batch: Arr.NonEmptyReadonlyArray<A>) => Effect.Effect<unknown, unknown>,
  ) =>
    sql
      .withTransaction(Effect.forEach(Arr.chunksOf(items, BATCH_SIZE), run, { discard: true }))
      .pipe(Effect.orDie);
