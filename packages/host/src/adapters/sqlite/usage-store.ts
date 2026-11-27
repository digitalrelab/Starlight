import type { UsagePeak } from "@starlight/contracts";
import { AgentProviderId } from "@starlight/contracts";
import { type UsageSample, UsageStore } from "@starlight/core";
import { Array as Arr, Effect, Layer, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";
import { batched } from "./batched.ts";

const WindowFilter = Schema.Struct({ now: Schema.Number, minDurationMs: Schema.Number });

const SampleRow = Schema.Struct({
  at: Schema.Number,
  provider: AgentProviderId,
  label: Schema.String,
  used_percent: Schema.Number,
  resets_at: Schema.Number,
  duration_ms: Schema.Number,
});

const PeakRow = Schema.Struct({
  provider: AgentProviderId,
  label: Schema.String,
  resets_at: Schema.Number,
  duration_ms: Schema.Number,
  peak_percent: Schema.Number,
});

const toSample = (row: typeof SampleRow.Type): UsageSample => ({
  at: row.at,
  provider: row.provider,
  label: row.label,
  usedPercent: row.used_percent,
  resetsAt: row.resets_at,
  durationMs: row.duration_ms,
});

const toPeak = (row: typeof PeakRow.Type): UsagePeak => ({
  provider: row.provider,
  label: row.label,
  resetsAt: row.resets_at,
  durationMs: row.duration_ms,
  peakPercent: row.peak_percent,
});

export const SqliteUsageStoreLive = Layer.effect(UsageStore)(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const inBatches = batched(sql);

    const open = SqlSchema.findAll({
      Request: WindowFilter,
      Result: SampleRow,
      execute: ({ now, minDurationMs }) => sql`
        SELECT at, provider, label, used_percent, resets_at, duration_ms
        FROM usage_samples
        WHERE resets_at > ${now} AND duration_ms >= ${minDurationMs}
        ORDER BY provider, label, resets_at, at
      `,
    });

    const peaks = SqlSchema.findAll({
      Request: WindowFilter,
      Result: PeakRow,
      execute: ({ now, minDurationMs }) => sql`
        SELECT provider, label, resets_at, duration_ms, MAX(used_percent) AS peak_percent
        FROM usage_samples
        WHERE resets_at <= ${now} AND duration_ms >= ${minDurationMs}
        GROUP BY provider, label, resets_at, duration_ms
        ORDER BY resets_at
      `,
    });

    return UsageStore.of({
      record: (samples) =>
        inBatches(
          samples,
          (batch) => sql`
            INSERT INTO usage_samples ${sql.insert(
              Arr.map(batch, (sample) => ({
                at: sample.at,
                provider: sample.provider,
                label: sample.label,
                used_percent: sample.usedPercent,
                resets_at: sample.resetsAt,
                duration_ms: sample.durationMs,
              })),
            )}
          `,
        ),
      forget: (before) =>
        sql`DELETE FROM usage_samples WHERE at < ${before}`.pipe(Effect.asVoid, Effect.orDie),
      open: (filter) =>
        open(filter).pipe(
          Effect.map((rows) => rows.map(toSample)),
          Effect.orDie,
        ),
      peaks: (filter) =>
        peaks(filter).pipe(
          Effect.map((rows) => rows.map(toPeak)),
          Effect.orDie,
        ),
    });
  }),
);
