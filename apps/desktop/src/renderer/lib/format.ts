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
