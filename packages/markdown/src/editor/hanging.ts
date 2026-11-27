import { syntaxTree } from "@codemirror/language";
import { type Line, RangeSetBuilder } from "@codemirror/state";
import { Decoration, type EditorView } from "@codemirror/view";
import type { Tree } from "@lezer/common";
import { cachedDecoration, visibleDecorations } from "./decorations.ts";

const MARKS = new Set(["HeaderMark", "ListMark", "QuoteMark", "TaskMarker"]);
const SPACE = /[ \t]/;

const lineDecoration = cachedDecoration((style) => Decoration.line({ attributes: { style } }));

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
  for (const { from, to } of view.visibleRanges) {
    for (let position = from; position <= to;) {
      const line = state.doc.lineAt(position);
      const style = styleOf(tree, line, state.tabSize);
      if (style) builder.add(line.from, line.from, lineDecoration(style));
      position = line.to + 1;
    }
  }
  return builder.finish();
};

export const hangingIndents = visibleDecorations(decorate);
