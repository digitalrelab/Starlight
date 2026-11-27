import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, type EditorView } from "@codemirror/view";
import { Tree } from "@lezer/common";
import { type Highlighter, highlightTree } from "@lezer/highlight";
import { cachedDecoration, visibleDecorations } from "./decorations.ts";
import { topLevelIn } from "./top-level.ts";

const markOf = cachedDecoration((classes) => Decoration.mark({ class: classes }));

const decorate = (view: EditorView, highlighters: readonly Highlighter[]) => {
  const builder = new RangeSetBuilder<Decoration>();
  const tree = syntaxTree(view.state);
  for (const { from, to } of view.visibleRanges) {
    const { children, positions } = topLevelIn(tree, from, to);
    const visible = new Tree(tree.type, children, positions, tree.length, tree.propValues);
    highlightTree(
      visible,
      highlighters,
      (start, end, classes) => builder.add(start, end, markOf(classes)),
      from,
      to,
    );
  }
  return builder.finish();
};

export const highlighting = (...highlighters: readonly Highlighter[]) =>
  visibleDecorations((view) => decorate(view, highlighters));
