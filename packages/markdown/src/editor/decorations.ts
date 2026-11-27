import { syntaxTree } from "@codemirror/language";
import {
  type Decoration,
  type DecorationSet,
  type EditorView,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";

export const cachedDecoration = (make: (key: string) => Decoration) => {
  const cache = new Map<string, Decoration>();
  return (key: string) => {
    let decoration = cache.get(key);
    if (!decoration) {
      decoration = make(key);
      cache.set(key, decoration);
    }
    return decoration;
  };
};

export const visibleDecorations = (decorate: (view: EditorView) => DecorationSet) =>
  ViewPlugin.fromClass(
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
