import type { AgentUsage, UsageWindow } from "@starlight/contracts";
import type { Effect } from "effect";
import { readUsage } from "#adapters/agent.ts";
import type { Connection } from "./connection.ts";

const MINUTE_MS = 60 * 1000;
const HOUR_MINS = 60;
const DAY_MINS = 24 * HOUR_MINS;
const WEEK_MINS = 7 * DAY_MINS;
const DEFAULT_LIMIT = "codex";

interface Window {
  readonly usedPercent: number;
  readonly windowDurationMins: number | null;
  readonly resetsAt: number | null;
}

interface Snapshot {
  readonly limitId: string | null;
  readonly limitName: string | null;
  readonly primary: Window | null;
  readonly secondary: Window | null;
}

interface RateLimits {
  readonly rateLimits: Snapshot;
  readonly rateLimitsByLimitId: Readonly<Record<string, Snapshot>> | null;
  readonly rateLimitResetCredits: { readonly availableCount: number } | null;
}

const spanOf = (minutes: number | null) => {
  if (minutes === null) return "Usage";
  if (minutes === WEEK_MINS) return "Weekly";
  if (minutes === DAY_MINS) return "Daily";
  if (minutes < DAY_MINS) return `${Math.round(minutes / HOUR_MINS)}-hour`;
  return `${Math.round(minutes / DAY_MINS)}-day`;
};

const windowsOf = ({ limitId, limitName, primary, secondary }: Snapshot) => {
  const scope = limitId === null || limitId === DEFAULT_LIMIT ? null : (limitName ?? limitId);
  return [primary, secondary].flatMap((window): Array<UsageWindow> => {
    if (!window) return [];
    const span = spanOf(window.windowDurationMins);
    return [
      {
        label: scope ? `${span} · ${scope}` : span,
        usedPercent: window.usedPercent,
        resetsAt: window.resetsAt === null ? null : window.resetsAt * 1000,
        durationMs: window.windowDurationMins === null ? null : window.windowDurationMins * MINUTE_MS,
      },
    ];
  });
};

const toUsage = ({ rateLimits, rateLimitsByLimitId, rateLimitResetCredits }: RateLimits): AgentUsage => {
  const snapshots = Object.values(rateLimitsByLimitId ?? {});
  const windows = (snapshots.length > 0 ? snapshots : [rateLimits])
    .flatMap(windowsOf)
    .toSorted((a, b) => (a.durationMs ?? Infinity) - (b.durationMs ?? Infinity));
  return {
    _tag: "Metered",
    windows,
    ...(rateLimitResetCredits ? { resetCredits: rateLimitResetCredits.availableCount } : {}),
  };
};

export const makeUsage = (connect: () => Promise<Connection>): Effect.Effect<AgentUsage> =>
  readUsage(
    "Codex",
    () => connect().then(({ server }) => server.request<RateLimits>("account/rateLimits/read", {})),
    toUsage,
  );
