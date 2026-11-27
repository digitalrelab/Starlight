import { syntaxTree } from "@codemirror/language";
import { type EditorState, RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  type EditorView,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";

const VERBATIM = new Set(["FencedCode", "CodeBlock", "HTMLBlock", "CommentBlock"]);
const HEADING = /^(#{1,6})[ \t]/;
const PREFIX = /^(?:[ \t]*>)*[ \t]*(?:(?:[-*+]|\d{1,9}[.)])[ \t]+(?:\[[ xX]\][ \t]+)?)?/;

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

const styleOf = (text: string, tabSize: number) => {
  const heading = HEADING.exec(text);
  if (heading?.[1]) return `text-indent: -${heading[1].length + 1}ch`;
  const prefix = PREFIX.exec(text)?.[0] ?? "";
  if (prefix === "") return undefined;
  const width = widthOf(prefix, tabSize);
  return `padding-inline-start: ${width}ch; text-indent: -${width}ch`;
};

const isVerbatim = (state: EditorState, position: number) => {
  for (let node = syntaxTree(state).resolveInner(position, 1); node.parent; node = node.parent) {
    if (VERBATIM.has(node.name)) return true;
  }
  return false;
};

const decorate = (view: EditorView) => {
  const builder = new RangeSetBuilder<Decoration>();
  const { state } = view;
  let previous = -1;
  for (const { from, to } of view.visibleRanges) {
    for (let position = from; position <= to;) {
      const line = state.doc.lineAt(position);
      if (line.from > previous && line.length > 0 && !isVerbatim(state, line.from)) {
        const style = styleOf(line.text, state.tabSize);
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
