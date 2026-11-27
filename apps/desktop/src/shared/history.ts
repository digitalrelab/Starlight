export const HISTORY_DIRECTIONS = {
  back: { label: "Back", key: "[", offset: -1 },
  forward: { label: "Forward", key: "]", offset: 1 },
} as const;

export type HistoryDirection = keyof typeof HISTORY_DIRECTIONS;

export const historyDirections = Object.keys(HISTORY_DIRECTIONS) as ReadonlyArray<HistoryDirection>;

export type HistoryAvailability = Readonly<Record<HistoryDirection, boolean>>;
