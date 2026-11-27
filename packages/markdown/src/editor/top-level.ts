import { Tree, type TreeBuffer } from "@lezer/common";

export interface TopLevel {
  readonly children: Array<Tree | TreeBuffer>;
  readonly positions: Array<number>;
  readonly start: number;
  readonly end: number;
}

export const topLevelIn = (tree: Tree, from: number, to: number, shift = 0): TopLevel => {
  const children: Array<Tree | TreeBuffer> = [];
  const positions: Array<number> = [];
  let start = Infinity;
  let end = -Infinity;
  const collect = (node: Tree, base: number) =>
    node.children.forEach((child, index) => {
      const childStart = base + (node.positions[index] ?? 0);
      const childEnd = childStart + child.length;
      if (childEnd <= from || childStart >= to) return;
      if (child instanceof Tree && child.type.isAnonymous && (childStart < from || childEnd > to)) {
        return collect(child, childStart);
      }
      children.push(child);
      positions.push(childStart - shift);
      start = Math.min(start, childStart);
      end = Math.max(end, childEnd);
    });
  collect(tree, 0);
  return { children, positions, start, end };
};
