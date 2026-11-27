import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  type EditorView,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";
import { Tree } from "@lezer/common";
import { type Highlighter, highlightTree } from "@lezer/highlight";
import { topLevelIn } from "./top-level.ts";

const marks = new Map<string, Decoration>();

const markOf = (classes: string) => {
  let mark = marks.get(classes);
  if (!mark) {
    mark = Decoration.mark({ class: classes });
    marks.set(classes, mark);
  }
  return mark;
};

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
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = decorate(view, highlighters);
      }

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          syntaxTree(update.startState) !== syntaxTree(update.state)
        ) {
          this.decorations = decorate(update.view, highlighters);
        }
      }
    },
    { decorations: (plugin) => plugin.decorations },
  );
