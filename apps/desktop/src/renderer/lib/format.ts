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
