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

const ages = [
  [365 * 24 * 60 * 60, "y"],
  [30 * 24 * 60 * 60, "mo"],
  [7 * 24 * 60 * 60, "w"],
  [24 * 60 * 60, "d"],
  [60 * 60, "h"],
  [60, "m"],
] as const;

export const formatAge = (epochMs: number, now = Date.now()) => {
  const seconds = Math.max(0, (now - epochMs) / 1000);
  for (const [size, unit] of ages) {
    if (seconds >= size) return `${Math.floor(seconds / size)}${unit}`;
  }
  return "now";
};
