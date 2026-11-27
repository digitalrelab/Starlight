export const HISTORY_STEPS = {
  back: { label: "Back", key: "[", offset: -1 },
  forward: { label: "Forward", key: "]", offset: 1 },
} as const;

export type HistoryDirection = keyof typeof HISTORY_STEPS;

export const historyDirections = Object.keys(HISTORY_STEPS) as ReadonlyArray<HistoryDirection>;

export type HistoryAvailability = Readonly<Record<HistoryDirection, boolean>>;
