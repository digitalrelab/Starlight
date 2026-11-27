import type { EditorState, TransactionSpec } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";

const LINK = /\[((?:\\.|[^\]\\])+)\]\(([^)\s]+)\)/g;

const escapeLabel = (label: string) => label.replace(/[\\[\]]/g, "\\$&");
const unescapeLabel = (label: string) => label.replace(/\\(.)/g, "$1");

export const insertLink = (
  state: EditorState,
  from: number,
  to: number,
  label: string,
  url: string,
): TransactionSpec => {
  const link = `[${escapeLabel(label)}](${url})`;
  const spaced = state.sliceDoc(to, to + 1) === " ";
  return {
    changes: { from, to, insert: spaced ? link : `${link} ` },
    selection: { anchor: from + link.length + 1 },
  };
};

class Chip extends WidgetType {
  constructor(readonly label: string) {
    super();
  }

  override eq(other: Chip) {
    return other.label === this.label;
  }

  toDOM() {
    const chip = document.createElement("span");
    chip.className = "md-mention";
    chip.textContent = this.label;
    return chip;
  }
}

export const mentionChips = (recognizes: (url: string) => boolean) => {
  const decorator = new MatchDecorator({
    regexp: LINK,
    decorate: (add, from, to, match) => {
      const [, label = "", url = ""] = match;
      if (recognizes(url)) add(from, to, Decoration.replace({ widget: new Chip(unescapeLabel(label)) }));
    },
  });
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = decorator.createDeco(view);
      }
      update(update: ViewUpdate) {
        this.decorations = decorator.updateDeco(update, this.decorations);
      }
    },
    {
      decorations: (plugin) => plugin.decorations,
      provide: (plugin) =>
        EditorView.atomicRanges.of((view) => view.plugin(plugin)?.decorations ?? Decoration.none),
    },
  );
};
