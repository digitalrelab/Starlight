import type { AgentProviderUsage, UsageHistory, UsagePoint, UsageSeries } from "@starlight/contracts";
import { Clock, Context, Duration, Effect, Layer, PubSub, Stream } from "effect";
import { Chats } from "./chats.ts";
import { AgentProviderDrivers, type UsageSample, UsageStore } from "./ports.ts";

const SAMPLE_INTERVAL = Duration.minutes(15);
const SETTLE_DELAY = Duration.seconds(3);
const RETENTION_MS = Duration.toMillis(Duration.weeks(12));
const HISTORY_MIN_DURATION_MS = Duration.toMillis(Duration.days(1));
const RESET_PRECISION_MS = Duration.toMillis(Duration.minutes(1));

const samplesOf = (at: number, usage: ReadonlyArray<AgentProviderUsage>): Array<UsageSample> =>
  usage.flatMap(({ provider, usage }) =>
    usage._tag === "Metered"
      ? usage.windows.flatMap(({ label, usedPercent, resetsAt, durationMs }) =>
          resetsAt === null || durationMs === null
            ? []
            : [
                {
                  at,
                  provider,
                  label,
                  usedPercent,
                  resetsAt: Math.round(resetsAt / RESET_PRECISION_MS) * RESET_PRECISION_MS,
                  durationMs,
                },
              ],
        )
      : [],
  );

const seriesOf = (samples: ReadonlyArray<UsageSample>): Array<UsageSeries> => {
  const series = new Map<string, { readonly window: UsageSample; readonly points: Array<UsagePoint> }>();
  for (const sample of samples) {
    const key = JSON.stringify([sample.provider, sample.label, sample.resetsAt]);
    const entry = series.get(key) ?? { window: sample, points: [] };
    series.set(key, entry);
    entry.points.push({ at: sample.at, usedPercent: sample.usedPercent });
  }
  return [...series.values()].map(({ window: { provider, label, resetsAt, durationMs }, points }) => ({
    provider,
    label,
    resetsAt,
    durationMs,
    points,
  }));
};

export class Usage extends Context.Service<
  Usage,
  {
    readonly read: Effect.Effect<ReadonlyArray<AgentProviderUsage>>;
    readonly reads: Stream.Stream<ReadonlyArray<AgentProviderUsage>>;
    readonly history: Effect.Effect<UsageHistory>;
  }
>()("@starlight/core/Usage") {
  static readonly layer = Layer.effect(Usage)(
    Effect.gen(function* () {
      const drivers = yield* AgentProviderDrivers;
      const store = yield* UsageStore;
      const reads = yield* PubSub.unbounded<ReadonlyArray<AgentProviderUsage>>();

      const read = Effect.gen(function* () {
        const usage = yield* Effect.forEach(
          drivers,
          ([provider, driver]) => Effect.map(driver.usage, (usage) => ({ provider, usage })),
          { concurrency: "unbounded" },
        );
        const at = yield* Clock.currentTimeMillis;
        yield* store.record(samplesOf(at, usage));
        yield* store.forget(at - RETENTION_MS);
        yield* PubSub.publish(reads, usage);
        return usage;
      });

      const history = Effect.gen(function* () {
        const windows = { now: yield* Clock.currentTimeMillis, minDurationMs: HISTORY_MIN_DURATION_MS };
        const [open, past] = yield* Effect.all([store.open(windows), store.peaks(windows)], {
          concurrency: "unbounded",
        });
        return { current: seriesOf(open), past };
      });

      return Usage.of({ read, reads: Stream.fromPubSub(reads), history });
    }),
  );
}

export const UsageSamplerLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const usage = yield* Usage;
    const chats = yield* Chats;
    yield* Stream.tick(SAMPLE_INTERVAL).pipe(
      Stream.merge(chats.settledTurns.pipe(Stream.debounce(SETTLE_DELAY))),
      Stream.runForEach(() => usage.read),
      Effect.forkScoped,
    );
  }),
);
