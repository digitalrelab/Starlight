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

const DAY_MS = 24 * 60 * 60 * 1000;

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
  ["d", DAY_MS],
  ["h", 60 * 60 * 1000],
  ["m", 60 * 1000],
] as const;

export const formatSpan = (ms: number, precision = 2) => {
  const pieces: Array<string> = [];
  let rest = ms;
  for (const [suffix, size] of SPAN_UNITS) {
    const count = Math.floor(rest / size);
    rest -= count * size;
    if (count > 0 || pieces.length > 0) pieces.push(`${count}${suffix}`);
  }
  const shown = pieces.slice(0, precision).filter((piece) => !piece.startsWith("0"));
  return shown.length > 0 ? shown.join(" ") : "<1m";
};
