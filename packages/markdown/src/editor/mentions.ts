import { syntaxTree } from "@codemirror/language";
import {
  type EditorSelection,
  type EditorState,
  RangeSetBuilder,
  type TransactionSpec,
} from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { destinationOf, unescape } from "#renderer/text.ts";
import { type Store, storeOf } from "./store.ts";

const CHIP = "md-mention";

const escapeLabel = (label: string) => label.replace(/[\\[\]]/g, "\\$&");

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

interface Mention {
  readonly url: string;
  readonly label: string;
}

interface MentionHost extends Mention {
  readonly key: string;
  readonly element: HTMLElement;
}

export type MentionHosts = Store<ReadonlyArray<MentionHost>>;

interface Placed extends Mention {
  readonly from: number;
  readonly to: number;
}

const createHosts = () => {
  const hosts = storeOf<ReadonlyArray<MentionHost>>([]);
  const store: MentionHosts = hosts;
  return {
    store,
    mount: (element: HTMLElement, mention: Mention) =>
      hosts.set([...hosts.get(), { ...mention, element, key: crypto.randomUUID() }]),
    unmount: (element: HTMLElement) => hosts.set(hosts.get().filter((host) => host.element !== element)),
  };
};

type Hosts = ReturnType<typeof createHosts>;

class Chip extends WidgetType {
  constructor(
    readonly mention: Mention,
    readonly selected: boolean,
    readonly hosts: Hosts,
  ) {
    super();
  }

  override eq(other: Chip) {
    return this.same(other) && other.selected === this.selected;
  }

  same({ mention }: Chip) {
    return mention.url === this.mention.url && mention.label === this.mention.label;
  }

  toDOM() {
    const element = document.createElement("span");
    element.className = CHIP;
    element.toggleAttribute("data-selected", this.selected);
    this.hosts.mount(element, this.mention);
    return element;
  }

  override updateDOM(element: HTMLElement, _view: EditorView, from: this) {
    if (!this.same(from)) return false;
    element.toggleAttribute("data-selected", this.selected);
    return true;
  }

  override destroy(element: HTMLElement) {
    this.hosts.unmount(element);
  }
}

const placedIn = (view: EditorView, recognizes: (url: string) => boolean) => {
  const { state } = view;
  const placed: Array<Placed> = [];
  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from,
      to,
      enter: ({ name, node }) => {
        if (name !== "Link") return;
        const [open, close] = node.getChildren("LinkMark");
        const target = node.getChild("URL");
        if (!open || !close || !target || node.from < (placed.at(-1)?.to ?? 0)) return false;
        const url = destinationOf(state.sliceDoc(target.from, target.to));
        if (recognizes(url)) {
          const label = unescape(state.sliceDoc(open.to, close.from));
          placed.push({ from: node.from, to: node.to, url, label });
        }
        return false;
      },
    });
  }
  return placed;
};

const covered = (selection: EditorSelection, { from, to }: Placed) =>
  selection.ranges.some((range) => range.from <= from && range.to >= to);

const decorationsOf = (selection: EditorSelection, placed: ReadonlyArray<Placed>, hosts: Hosts) => {
  const builder = new RangeSetBuilder<Decoration>();
  for (const each of placed) {
    const widget = new Chip({ url: each.url, label: each.label }, covered(selection, each), hosts);
    builder.add(each.from, each.to, Decoration.replace({ widget }));
  }
  return builder.finish();
};

const plainPress = (event: MouseEvent) => event.button === 0 && !event.metaKey && !event.ctrlKey;

export const mentionChips = (recognizes: (url: string) => boolean) => {
  const hosts = createHosts();

  class Chips {
    placed: ReadonlyArray<Placed>;
    decorations: DecorationSet;

    constructor(readonly view: EditorView) {
      this.placed = placedIn(view, recognizes);
      this.decorations = decorationsOf(view.state.selection, this.placed, hosts);
      view.contentDOM.addEventListener("mousedown", this.press, true);
      view.contentDOM.addEventListener("click", this.click, true);
    }

    update(update: ViewUpdate) {
      const scan =
        update.docChanged ||
        update.viewportChanged ||
        syntaxTree(update.state) !== syntaxTree(update.startState);
      if (scan) this.placed = placedIn(update.view, recognizes);
      if (scan || update.selectionSet)
        this.decorations = decorationsOf(update.state.selection, this.placed, hosts);
    }

    destroy() {
      this.view.contentDOM.removeEventListener("mousedown", this.press, true);
      this.view.contentDOM.removeEventListener("click", this.click, true);
    }

    pressed(event: MouseEvent) {
      const host = event.target instanceof Element && event.target.closest(`.${CHIP}`);
      if (!host || !plainPress(event) || !this.view.state.facet(EditorView.editable)) return undefined;
      const from = this.view.posAtDOM(host);
      return this.placed.find((each) => each.from === from);
    }

    readonly press = (event: MouseEvent) => {
      const placed = this.pressed(event);
      if (!placed) return;
      event.preventDefault();
      this.view.focus();
      this.view.dispatch({ selection: { anchor: placed.from, head: placed.to } });
    };

    readonly click = (event: MouseEvent) => {
      if (this.pressed(event)) event.preventDefault();
    };
  }

  const plugin = ViewPlugin.fromClass(Chips, {
    decorations: (chips) => chips.decorations,
    provide: (self) =>
      EditorView.atomicRanges.of((view) => view.plugin(self)?.decorations ?? Decoration.none),
  });

  return { extension: plugin, hosts: hosts.store };
};
