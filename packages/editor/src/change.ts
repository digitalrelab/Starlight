export interface Change {
  readonly fromA: number;
  readonly toA: number;
  readonly fromB: number;
  readonly toB: number;
}

export const changeBetween = (a: string, b: string): Change | undefined => {
  if (a === b) return undefined;
  const limit = Math.min(a.length, b.length);
  let start = 0;
  while (start < limit && a.charCodeAt(start) === b.charCodeAt(start)) start++;
  let end = 0;
  while (end < limit - start && a.charCodeAt(a.length - 1 - end) === b.charCodeAt(b.length - 1 - end)) end++;
  return { fromA: start, toA: a.length - end, fromB: start, toB: b.length - end };
};
