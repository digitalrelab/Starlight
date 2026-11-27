import type { MediaSnapshot } from "./media.ts";

export type Status = "idle" | "loading" | "ended" | "failed";

export const statusOf = (state: MediaSnapshot, isStarting: boolean): Status | null => {
  if (state.failed) return "failed";
  if (isStarting) return "loading";
  if (state.ended) return "ended";
  if (state.buffering) return "loading";
  if (state.paused && !state.started) return "idle";
  return null;
};

export const isOccupied = (status: Status | null) => status !== null && status !== "loading";
