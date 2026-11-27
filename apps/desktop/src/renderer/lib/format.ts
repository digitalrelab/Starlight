const sizeFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
const units = ["B", "KB", "MB", "GB", "TB"] as const;

export const formatSize = (bytes: number) => {
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit++;
  }
  return `${sizeFormat.format(value)} ${units[unit]}`;
};

export const formatDate = (epochMs: number) => dateFormat.format(epochMs);

const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const dayFormat = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const dayTimeFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});

export const formatWeekday = (epochMs: number) => weekdayFormat.format(epochMs);

export const formatDay = (epochMs: number) => dayFormat.format(epochMs);

export const formatDayTime = (epochMs: number) => dayTimeFormat.format(epochMs);

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const recencies = [
  [0, "Today"],
  [1, "Yesterday"],
  [7, "Previous 7 days"],
  [30, "Previous 30 days"],
] as const;

export const formatRecency = (epochMs: number) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const days = Math.ceil((today - epochMs) / DAY_MS);
  return recencies.find(([within]) => days <= within)?.[1] ?? "Older";
};

const SPAN_UNITS = [
  { suffix: "d", size: DAY_MS, within: Infinity },
  { suffix: "h", size: HOUR_MS, within: 24 },
  { suffix: "m", size: MINUTE_MS, within: 60 },
] as const;

export const formatSpan = (ms: number, precision = 2) => {
  const counts = SPAN_UNITS.map(({ suffix, size, within }) => ({
    suffix,
    count: Math.floor(ms / size) % within,
  }));
  const first = counts.findIndex(({ count }) => count > 0);
  if (first === -1) return "<1m";
  return counts
    .slice(first, first + precision)
    .filter(({ count }) => count > 0)
    .map(({ suffix, count }) => `${count}${suffix}`)
    .join(" ");
};
