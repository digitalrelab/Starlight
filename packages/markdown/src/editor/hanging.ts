import { syntaxTree } from "@codemirror/language";
import type { Tree } from "@lezer/common";
import { type Line, RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  type EditorView,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";

const MARKS = new Set(["HeaderMark", "ListMark", "QuoteMark", "TaskMarker"]);
const SPACE = /[ \t]/;

const decorations = new Map<string, Decoration>();

const lineDecoration = (style: string) => {
  let decoration = decorations.get(style);
  if (!decoration) {
    decoration = Decoration.line({ attributes: { style } });
    decorations.set(style, decoration);
  }
  return decoration;
};

const widthOf = (text: string, tabSize: number) => {
  let width = 0;
  for (const char of text) width = char === "\t" ? width + tabSize - (width % tabSize) : width + 1;
  return width;
};

const styleOf = (tree: Tree, line: Line, tabSize: number) => {
  let end = line.from;
  let isHeading = false;
  for (;;) {
    while (end < line.to && SPACE.test(line.text.charAt(end - line.from))) end++;
    const mark = tree.resolveInner(end, 1);
    if (end === line.to || mark.from !== end || !MARKS.has(mark.name)) break;
    isHeading ||= mark.name === "HeaderMark" && end === line.from;
    end = mark.to;
  }
  if (end === line.from) return undefined;
  const width = widthOf(line.text.slice(0, end - line.from), tabSize);
  return isHeading
    ? `text-indent: -${width}ch`
    : `padding-inline-start: ${width}ch; text-indent: -${width}ch`;
};

const decorate = (view: EditorView) => {
  const builder = new RangeSetBuilder<Decoration>();
  const { state } = view;
  const tree = syntaxTree(state);
  let previous = -1;
  for (const { from, to } of view.visibleRanges) {
    for (let position = from; position <= to;) {
      const line = state.doc.lineAt(position);
      if (line.from > previous) {
        const style = styleOf(tree, line, state.tabSize);
        if (style) builder.add(line.from, line.from, lineDecoration(style));
      }
      previous = line.from;
      position = line.to + 1;
    }
  }
  return builder.finish();
};

export const hangingIndents = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = decorate(view);
    }

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.viewportChanged ||
        syntaxTree(update.startState) !== syntaxTree(update.state)
      ) {
        this.decorations = decorate(update.view);
      }
    }
  },
  { decorations: (plugin) => plugin.decorations },
);
