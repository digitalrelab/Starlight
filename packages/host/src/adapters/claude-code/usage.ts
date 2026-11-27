import type { SDKControlGetUsageResponse } from "@anthropic-ai/claude-agent-sdk";
import type { AgentUsage, UsageWindow } from "@starlight/contracts";
import { Effect } from "effect";
import { asError, unmetered } from "#adapters/agent.ts";
import { COMMAND_TIMEOUT_MS } from "#adapters/cli.ts";
import type { Pool } from "./pool.ts";

const HOUR_MS = 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * HOUR_MS;

interface Window {
  readonly utilization: number | null;
  readonly resets_at: string | null;
}

const windowOf = (label: string, durationMs: number, window: Window | null | undefined): Array<UsageWindow> =>
  window && window.utilization !== null
    ? [
        {
          label,
          usedPercent: window.utilization,
          resetsAt: window.resets_at === null ? null : Date.parse(window.resets_at),
          durationMs,
        },
      ]
    : [];

const toUsage = ({ subscription_type, rate_limits }: SDKControlGetUsageResponse): AgentUsage => {
  if (!rate_limits) {
    return unmetered(
      subscription_type
        ? "Claude didn't report usage limits."
        : "Usage limits apply only to Claude subscriptions.",
    );
  }
  const windows = [
    ...windowOf("5-hour", 5 * HOUR_MS, rate_limits.five_hour),
    ...windowOf("Weekly", WEEK_MS, rate_limits.seven_day),
    ...windowOf("Weekly · Opus", WEEK_MS, rate_limits.seven_day_opus),
    ...windowOf("Weekly · Sonnet", WEEK_MS, rate_limits.seven_day_sonnet),
    ...(rate_limits.model_scoped ?? []).flatMap((window) =>
      windowOf(`Weekly · ${window.display_name}`, WEEK_MS, window),
    ),
  ];
  return {
    _tag: "Metered",
    windows: windows.filter(
      (window, index) => windows.findIndex(({ label }) => label === window.label) === index,
    ),
  };
};

export const makeUsage = (pool: Pool): Effect.Effect<AgentUsage> =>
  Effect.tryPromise({ try: () => pool.prepare().then((session) => session.usage()), catch: asError }).pipe(
    Effect.timeout(COMMAND_TIMEOUT_MS),
    Effect.map(toUsage),
    Effect.catch((error) => Effect.succeed(unmetered(error.message))),
  );
