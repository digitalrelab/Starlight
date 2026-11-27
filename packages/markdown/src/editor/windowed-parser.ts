import {
  type Input,
  Parser,
  type PartialParse,
  type SyntaxNode,
  Tree,
  type TreeFragment,
} from "@lezer/common";
import { topLevelIn } from "./top-level.ts";

const OPEN_ENDED = new Set(["BulletList", "OrderedList", "CodeBlock"]);
const BLANK_LINE = /\n[ \t]*\n/;
const MAX_WINDOW = 32 * 1024;

interface Reuse {
  readonly tree: Tree;
  readonly prefixEnd: number;
  readonly suffixStart: number;
  readonly offset: number;
}

const reuseOf = (fragments: readonly TreeFragment[], length: number): Reuse | undefined => {
  if (fragments.length === 0 || fragments.length > 2) return undefined;
  const [first, second] = fragments;
  if (!first) return undefined;
  const prefix = first.from === 0 && first.offset === 0 ? first : undefined;
  const suffix = second ?? (prefix ? undefined : first);
  if (second && second.tree !== first.tree) return undefined;
  if (suffix && (suffix.to !== length || suffix.tree.length !== suffix.to + suffix.offset)) return undefined;
  return {
    tree: first.tree,
    prefixEnd: prefix?.to ?? 0,
    suffixStart: suffix?.from ?? length,
    offset: suffix?.offset ?? 0,
  };
};

const freshStartAfter = (input: Input, block: SyntaxNode, next: number, offset = 0) => {
  if (OPEN_ENDED.has(block.name)) return undefined;
  const gap = input.read(block.to - offset, next - offset);
  return BLANK_LINE.test(gap) ? block.to - offset + gap.lastIndexOf("\n") + 1 : undefined;
};

const restartBefore = ({ tree, prefixEnd }: Reuse, input: Input) => {
  for (let block = tree.topNode.childBefore(prefixEnd + 1); block; block = block.prevSibling) {
    const before = block.prevSibling;
    if (!before) return 0;
    if (block.from < prefixEnd - MAX_WINDOW) return undefined;
    const start = freshStartAfter(input, before, block.from);
    if (start !== undefined) return start;
  }
  return 0;
};

function* resumesAfter({ tree, suffixStart, offset }: Reuse, input: Input, limit: number) {
  for (let block = tree.topNode.childAfter(suffixStart + offset); block; block = block.nextSibling) {
    if (block.from - offset > limit) return;
    const before = block.prevSibling;
    const start =
      before && before.to - offset >= suffixStart
        ? freshStartAfter(input, before, block.from, offset)
        : undefined;
    if (start !== undefined) yield start;
  }
  yield input.length;
}

const settlesAt = (input: Input, parsed: Tree, from: number) => {
  const last = parsed.topNode.lastChild;
  return !last || freshStartAfter(input, last, parsed.length, -from) !== undefined;
};

const splice = ({ tree, offset }: Reuse, parsed: Tree, from: number, to: number, length: number) => {
  const before = topLevelIn(tree, 0, from);
  const reparsed = topLevelIn(parsed, 0, parsed.length, -from);
  const after = to < length ? topLevelIn(tree, to + offset, tree.length, offset) : undefined;
  if (before.end > from || (after && after.start < to + offset)) return undefined;
  const parts = after ? [before, reparsed, after] : [before, reparsed];
  return new Tree(
    tree.type,
    parts.flatMap((part) => part.children),
    parts.flatMap((part) => part.positions),
    length,
    tree.propValues,
  ).balance();
};

const reparseWindow = (inner: Parser, input: Input, reuse: Reuse) => {
  const from = restartBefore(reuse, input);
  if (from === undefined) return undefined;
  let to = from;
  for (const boundary of resumesAfter(reuse, input, from + MAX_WINDOW)) {
    if (boundary < input.length && boundary < 2 * to - from) continue;
    if (boundary - from > MAX_WINDOW) return undefined;
    to = boundary;
    const parsed = inner.parse(input, [], [{ from, to }]);
    if (to === input.length || settlesAt(input, parsed, from))
      return splice(reuse, parsed, from, to, input.length);
  }
  return undefined;
};

const finishedParse = (tree: Tree): PartialParse => ({
  parsedPos: tree.length,
  stoppedAt: null,
  advance: () => tree,
  stopAt: () => undefined,
});

export class WindowedParser extends Parser {
  constructor(private readonly inner: Parser) {
    super();
  }

  createParse(
    input: Input,
    fragments: readonly TreeFragment[],
    ranges: readonly { from: number; to: number }[],
  ): PartialParse {
    const whole = ranges.length === 1 && ranges[0]?.from === 0 && ranges[0].to === input.length;
    const reuse = whole ? reuseOf(fragments, input.length) : undefined;
    const tree = reuse && reparseWindow(this.inner, input, reuse);
    return tree ? finishedParse(tree) : this.inner.startParse(input, fragments, ranges);
  }
}
