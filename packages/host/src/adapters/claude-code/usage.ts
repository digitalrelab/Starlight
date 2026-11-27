import type { SDKControlGetUsageResponse } from "@anthropic-ai/claude-agent-sdk";
import type { AgentUsage, UsageWindow } from "@starlight/contracts";
import { Duration, type Effect } from "effect";
import { readUsage, unavailable } from "#adapters/agent.ts";
import type { Pool } from "./pool.ts";

const FIVE_HOURS_MS = Duration.toMillis(Duration.hours(5));
const WEEK_MS = Duration.toMillis(Duration.weeks(1));

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
    return unavailable(
      subscription_type
        ? "Claude didn't report usage limits."
        : "Usage limits apply only to Claude subscriptions.",
    );
  }
  const windows = [
    ...windowOf("5-hour", FIVE_HOURS_MS, rate_limits.five_hour),
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
  readUsage("Claude Code", () => pool.prepare().then((session) => session.usage()), toUsage);
