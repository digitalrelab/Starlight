export interface JustifyOptions {
  readonly width: number;
  readonly targetHeight: number;
  readonly maxHeight: number;
  readonly gap: number;
}

export interface JustifiedRow {
  readonly start: number;
  readonly end: number;
  readonly height: number;
}

export interface JustifiedLayout {
  readonly rows: ReadonlyArray<JustifiedRow>;
  readonly left: Float64Array;
  readonly width: Float64Array;
  readonly rowOf: Uint32Array;
}

const fitHeight = (width: number, gap: number, count: number, aspectSum: number) =>
  (width - gap * (count - 1)) / aspectSum;

export const justify = (aspects: Float64Array, options: JustifyOptions): JustifiedLayout => {
  const { width, targetHeight, maxHeight, gap } = options;
  const count = width > 0 ? aspects.length : 0;
  const left = new Float64Array(count);
  const widths = new Float64Array(count);
  const rowOf = new Uint32Array(count);
  const rows: Array<JustifiedRow> = [];

  let start = 0;
  while (start < count) {
    let end = start;
    let aspectSum = 0;
    let height = targetHeight;
    while (end < count) {
      aspectSum += aspects[end] ?? 1;
      end++;
      const fit = fitHeight(width, gap, end - start, aspectSum);
      if (fit > targetHeight) continue;
      height = fit;
      if (end - start > 1) {
        const shorterSum = aspectSum - (aspects[end - 1] ?? 1);
        const shorterFit = fitHeight(width, gap, end - start - 1, shorterSum);
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
      const next = x + (aspects[i] ?? 1) * height;
      left[i] = Math.round(x);
      widths[i] = Math.round(next) - left[i]!;
      rowOf[i] = rowIndex;
      x = next + gap;
    }
    rows.push({ start, end, height: Math.round(height) });
    start = end;
  }
  return { rows, left, width: widths, rowOf };
};

export const nearestInRow = (layout: JustifiedLayout, row: JustifiedRow, center: number) => {
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
