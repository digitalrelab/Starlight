import {
  autocompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  MatchDecorator,
  tooltips,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";

export interface Mention {
  readonly label: string;
  readonly url: string;
  readonly detail?: string | undefined;
  readonly icon?: Node | undefined;
}

export interface Mentions {
  readonly search: (query: string) => Promise<ReadonlyArray<Mention>>;
  readonly recognizes: (url: string) => boolean;
}

interface MentionCompletion extends Completion {
  readonly mention: Mention;
}

const TRIGGER = /@[^\s@[\]()]+/;
const LINK = /\[((?:\\.|[^\]\\])+)\]\(([^)\s]+)\)/g;

const escapeLabel = (label: string) => label.replace(/[\\[\]]/g, "\\$&");
const unescapeLabel = (label: string) => label.replace(/\\(.)/g, "$1");

const completions =
  ({ search }: Mentions) =>
  async (context: CompletionContext): Promise<CompletionResult | null> => {
    const typed = context.matchBefore(TRIGGER);
    if (!typed) return null;
    if (typed.from > 0 && !/\s/.test(context.state.sliceDoc(typed.from - 1, typed.from))) return null;
    const found = await search(typed.text.slice(1));
    if (context.aborted) return null;
    return {
      from: typed.from,
      filter: false,
      options: found.map((mention): MentionCompletion => ({
        label: mention.label,
        apply: `[${escapeLabel(mention.label)}](${mention.url})`,
        mention,
        ...(mention.detail === undefined ? {} : { detail: mention.detail }),
      })),
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

const chips = ({ recognizes }: Mentions) => {
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

const iconOf = (completion: Completion) =>
  (completion as MentionCompletion).mention.icon?.cloneNode(true) ?? null;

export const mentions = (source: Mentions) => [
  autocompletion({
    override: [completions(source)],
    icons: false,
    addToOptions: [{ render: iconOf, position: 20 }],
  }),
  tooltips({ parent: document.body }),
  chips(source),
];
