import type { UsageWindow } from "@starlight/client";

export type UsageTone = "neutral" | "warning" | "danger";

export interface Pace {
  readonly tone: UsageTone;
  readonly elapsed: number | null;
  readonly resetsIn: number | null;
  readonly runsOutIn: number | null;
}

const FULL_PERCENT = 100;
const DANGER_PERCENT = 90;

const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), max);

export const paceOf = ({ usedPercent, resetsAt, durationMs }: UsageWindow, now: number): Pace => {
  const resetsIn = resetsAt === null ? null : Math.max(resetsAt - now, 0);
  const elapsedMs =
    resetsIn === null || durationMs === null ? null : clamp(durationMs - resetsIn, durationMs);
  const projected =
    elapsedMs && usedPercent > 0 && usedPercent < FULL_PERCENT
      ? ((FULL_PERCENT - usedPercent) * elapsedMs) / usedPercent
      : null;
  const runsOutIn = projected !== null && resetsIn !== null && projected < resetsIn ? projected : null;
  return {
    tone: usedPercent >= DANGER_PERCENT ? "danger" : runsOutIn !== null ? "warning" : "neutral",
    elapsed: elapsedMs === null || !durationMs ? null : elapsedMs / durationMs,
    resetsIn,
    runsOutIn,
  };
};
