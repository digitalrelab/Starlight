import {
  type EditorState,
  Prec,
  StateEffect,
  type StateEffectType,
  StateField,
  type Transaction,
  type TransactionSpec,
} from "@codemirror/state";
import {
  EditorView,
  getTooltip,
  keymap,
  showTooltip,
  type Tooltip,
  tooltips,
  ViewPlugin,
} from "@codemirror/view";
import { useState } from "react";

export interface TriggerSource<Choice> {
  readonly character: string;
  readonly apply: (choice: Choice, state: EditorState, from: number, to: number) => TransactionSpec;
  readonly warm?: () => void;
}

interface Trigger<Choice> {
  readonly from: number;
  readonly query: string;
  readonly choices: ReadonlyArray<Choice>;
  readonly index: number;
  readonly tooltip: Tooltip;
}

export interface ActiveTrigger<Choice> {
  readonly query: string;
  readonly choices: ReadonlyArray<Choice>;
  readonly index: number;
  readonly host: () => HTMLElement | undefined;
  readonly choose: (choice: Choice) => void;
  readonly highlight: (index: number) => void;
  readonly resolve: (choices: ReadonlyArray<Choice>) => void;
  readonly dismiss: () => void;
}

export interface TriggerStore<Choice> {
  readonly get: () => ActiveTrigger<Choice> | null;
  readonly subscribe: (listener: () => void) => () => void;
}

const storeOf = <Value>(initial: Value) => {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next: Value) => {
      value = next;
      for (const listener of listeners) listener();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

const latestIn = <Value>(tr: Transaction, type: StateEffectType<Value>, fallback: Value) => {
  const effect = tr.effects.findLast((each) => each.is(type));
  return effect ? (effect.value as Value) : fallback;
};

const tooltipAt = (pos: number): Tooltip => ({
  pos,
  create: () => {
    const dom = document.createElement("div");
    dom.className = "md-trigger";
    return { dom };
  },
});

const createTrigger = <Choice>(source: TriggerSource<Choice>) => {
  const { character } = source;
  const highlighted = StateEffect.define<number>();
  const resolved = StateEffect.define<ReadonlyArray<Choice>>();
  const dismissed = StateEffect.define<null>();

  const openedAt = (tr: Transaction) => {
    let opened: number | null = null;
    tr.changes.iterChanges((_fromA, _toA, _fromB, toB, inserted) => {
      if (!inserted.toString().endsWith(character)) return;
      const at = toB - character.length;
      const before = tr.state.sliceDoc(at - 1, at);
      if (before === "" || /\s/.test(before)) opened = at;
    });
    return opened;
  };

  const follow = (trigger: Trigger<Choice>, tr: Transaction): Trigger<Choice> | null => {
    const from = tr.changes.mapPos(trigger.from);
    const head = tr.state.selection.main.head;
    const query = tr.state.sliceDoc(from + character.length, head);
    const intact =
      tr.state.sliceDoc(from, from + character.length) === character &&
      head > from &&
      tr.state.doc.lineAt(from).to >= head &&
      !/^\s/.test(query);
    if (!intact) return null;
    const choices = latestIn(tr, resolved, trigger.choices);
    const index = latestIn(
      tr,
      highlighted,
      query === trigger.query ? Math.min(trigger.index, Math.max(choices.length - 1, 0)) : 0,
    );
    const unchanged =
      from === trigger.from &&
      query === trigger.query &&
      choices === trigger.choices &&
      index === trigger.index;
    if (unchanged) return trigger;
    const tooltip = from === trigger.from ? trigger.tooltip : tooltipAt(from);
    return { from, query, choices, index, tooltip };
  };

  const field = StateField.define<Trigger<Choice> | null>({
    create: () => null,
    update: (trigger, tr) => {
      if (tr.effects.some((effect) => effect.is(dismissed))) return null;
      if (trigger === null) {
        const from = tr.isUserEvent("input.type") ? openedAt(tr) : null;
        if (from === null) return null;
        return { from, query: "", choices: [], index: 0, tooltip: tooltipAt(from) };
      }
      return tr.docChanged || tr.selection || tr.effects.length > 0 ? follow(trigger, tr) : trigger;
    },
    provide: (self) => showTooltip.from(self, (trigger) => trigger?.tooltip ?? null),
  });

  const choose = (view: EditorView, choice: Choice) => {
    const trigger = view.state.field(field);
    if (trigger === null) return;
    view.dispatch(source.apply(choice, view.state, trigger.from, view.state.selection.main.head), {
      effects: dismissed.of(null),
    });
  };

  const highlight = (view: EditorView, index: number) => view.dispatch({ effects: highlighted.of(index) });

  const resolve = (view: EditorView, choices: ReadonlyArray<Choice>) =>
    view.dispatch({ effects: resolved.of(choices) });

  const dismiss = (view: EditorView) => view.dispatch({ effects: dismissed.of(null) });

  const withChoices = (run: (view: EditorView, trigger: Trigger<Choice>) => void) => (view: EditorView) => {
    const trigger = view.state.field(field);
    if (trigger === null || trigger.choices.length === 0) return false;
    run(view, trigger);
    return true;
  };

  const step = (offset: number) =>
    withChoices((view, { choices, index }) =>
      highlight(view, (index + offset + choices.length) % choices.length),
    );

  const chooseHighlighted = withChoices((view, { choices, index }) => {
    const choice = choices[index];
    if (choice !== undefined) choose(view, choice);
  });

  const store = storeOf<{ readonly view: EditorView; readonly active: ActiveTrigger<Choice> } | null>(null);

  const activeOf = (view: EditorView, trigger: Trigger<Choice>): ActiveTrigger<Choice> => ({
    query: trigger.query,
    choices: trigger.choices,
    index: trigger.index,
    host: () => getTooltip(view, trigger.tooltip)?.dom,
    choose: (choice) => choose(view, choice),
    highlight: (index) => highlight(view, index),
    resolve: (choices) => resolve(view, choices),
    dismiss: () => dismiss(view),
  });

  return {
    extension: [
      field,
      tooltips({ parent: document.body }),
      Prec.highest(
        keymap.of([
          { key: "ArrowDown", run: step(1) },
          { key: "ArrowUp", run: step(-1) },
          { key: "Enter", run: chooseHighlighted },
          { key: "Tab", run: chooseHighlighted },
          { key: "Escape", stopPropagation: true, run: withChoices(dismiss) },
        ]),
      ),
      EditorView.updateListener.of(({ view, state, startState }) => {
        const trigger = state.field(field);
        if (trigger !== startState.field(field))
          store.set(trigger && { view, active: activeOf(view, trigger) });
      }),
      ViewPlugin.define((view) => ({
        destroy: () => {
          if (store.get()?.view === view) store.set(null);
        },
      })),
      source.warm ? EditorView.domEventHandlers({ focus: source.warm }) : [],
    ],
    store: {
      get: () => store.get()?.active ?? null,
      subscribe: store.subscribe,
    } satisfies TriggerStore<Choice>,
  };
};

export const useTrigger = <Choice>(source: TriggerSource<Choice>) => useState(() => createTrigger(source))[0];
