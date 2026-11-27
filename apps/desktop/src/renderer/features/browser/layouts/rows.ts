export interface JustifyOptions {
  readonly width: number;
  readonly targetHeight: number;
  readonly maxHeight: number;
  readonly gap: number;
  readonly chrome: { readonly width: number; readonly height: number };
}

export interface ShelfOptions {
  readonly width: number;
  readonly minWidth: number;
  readonly height: number;
  readonly gap: number;
}

export interface Row {
  readonly start: number;
  readonly end: number;
  readonly height: number;
  readonly gap: number;
}

export interface RowLayout {
  readonly rows: ReadonlyArray<Row>;
  readonly left: Float64Array;
  readonly width: Float64Array;
  readonly rowOf: Uint32Array;
}

const fitHeight = (width: number, gap: number, chrome: number, count: number, aspectSum: number) =>
  Math.max(0, (width - gap * (count - 1) - chrome * count) / aspectSum);

export const justify = (aspects: Float64Array, options: JustifyOptions): RowLayout => {
  const { width, targetHeight, maxHeight, gap, chrome } = options;
  const count = width > 0 ? aspects.length : 0;
  const left = new Float64Array(count);
  const widths = new Float64Array(count);
  const rowOf = new Uint32Array(count);
  const rows: Array<Row> = [];

  let start = 0;
  while (start < count) {
    let end = start;
    let aspectSum = 0;
    let height = targetHeight;
    while (end < count) {
      aspectSum += aspects[end]!;
      end++;
      const fit = fitHeight(width, gap, chrome.width, end - start, aspectSum);
      if (fit > targetHeight) continue;
      height = fit;
      if (end - start > 1) {
        const shorterSum = aspectSum - aspects[end - 1]!;
        const shorterFit = fitHeight(width, gap, chrome.width, end - start - 1, shorterSum);
        if (shorterFit <= maxHeight && shorterFit - targetHeight < targetHeight - fit) {
          end--;
          height = shorterFit;
        }
      }
      break;
    }
    height = Math.min(height, maxHeight);

    const rowIndex = rows.length;
    let x = 0;
    for (let i = start; i < end; i++) {
      const next = x + aspects[i]! * height + chrome.width;
      left[i] = Math.round(x);
      widths[i] = Math.round(next) - left[i]!;
      rowOf[i] = rowIndex;
      x = next + gap;
    }
    rows.push({ start, end, height: Math.round(height + chrome.height), gap });
    start = end;
  }
  return { rows, left, width: widths, rowOf };
};

export const shelve = (count: number, options: ShelfOptions): RowLayout => {
  const { width, minWidth, height, gap } = options;
  const total = width > 0 ? count : 0;
  const columns = Math.max(1, Math.floor((width + gap) / (minWidth + gap)));
  const column = (width - gap * (columns - 1)) / columns;
  const left = new Float64Array(total);
  const widths = new Float64Array(total);
  const rowOf = new Uint32Array(total);
  const rows: Array<Row> = [];
  for (let i = 0; i < total; i++) {
    const x = (i % columns) * (column + gap);
    left[i] = Math.round(x);
    widths[i] = Math.round(x + column) - left[i]!;
    rowOf[i] = Math.floor(i / columns);
    if (i % columns === 0) rows.push({ start: i, end: Math.min(total, i + columns), height, gap });
  }
  return { rows, left, width: widths, rowOf };
};

export const dropLeading = ({ rows, left, width, rowOf }: RowLayout, count: number): RowLayout => ({
  rows: rows.map((row) => ({
    ...row,
    start: Math.max(0, row.start - count),
    end: Math.max(0, row.end - count),
  })),
  left: left.subarray(count),
  width: width.subarray(count),
  rowOf: rowOf.subarray(count),
});

export const stack = (
  top: RowLayout,
  topLeft: number,
  bottom: RowLayout,
  bottomLeft: number,
  gap: number,
): RowLayout => {
  const offset = top.left.length;
  const left = new Float64Array(offset + bottom.left.length);
  const width = new Float64Array(left.length);
  const rowOf = new Uint32Array(left.length);
  left.set(top.left.map((x) => x + topLeft));
  left.set(
    bottom.left.map((x) => x + bottomLeft),
    offset,
  );
  width.set(top.width);
  width.set(bottom.width, offset);
  rowOf.set(top.rowOf);
  rowOf.set(
    bottom.rowOf.map((row) => row + top.rows.length),
    offset,
  );
  const rows = [
    ...top.rows.map((row, index) => (index === top.rows.length - 1 ? { ...row, gap } : row)),
    ...bottom.rows.map((row) => ({ ...row, start: row.start + offset, end: row.end + offset })),
  ];
  return { rows, left, width, rowOf };
};

export const nearestInRow = (layout: RowLayout, row: Row, center: number) => {
  let best = row.start;
  let bestDistance = Infinity;
  for (let i = row.start; i < row.end; i++) {
    const distance = Math.abs(layout.left[i]! + layout.width[i]! / 2 - center);
    if (distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  }
  return best;
};
