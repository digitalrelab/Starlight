import { type Entry, type EntryRef, entryKey } from "@starlight/client";
import { useEffect, useEffectEvent, useLayoutEffect, useSyncExternalStore } from "react";

export const selectionId = (entry: Entry) => entry.fileId ?? entryKey(entry.ref);

export interface Modifiers {
  readonly toggle: boolean;
  readonly extend: boolean;
}

interface State {
  readonly ids: ReadonlySet<string>;
  readonly anchor: string | undefined;
  readonly focus: string | undefined;
}

const EMPTY: State = { ids: new Set(), anchor: undefined, focus: undefined };

const only = (id: string): State => ({ ids: new Set([id]), anchor: id, focus: id });

export const createSelection = () => {
  let items: ReadonlyArray<string> = [];
  let positions = new Map<string, number>();
  let state = EMPTY;
  const listeners = new Set<() => void>();
  const focusListeners = new Set<(index: number) => void>();

  const commit = (next: State) => {
    const moved = next.focus !== state.focus;
    state = next;
    for (const listener of listeners) listener();
    const index = moved && next.focus !== undefined ? positions.get(next.focus) : undefined;
    if (index !== undefined) for (const listener of focusListeners) listener(index);
  };

  const present = (id: string | undefined) => (id !== undefined && positions.has(id) ? id : undefined);

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    subscribeFocus: (listener: (index: number) => void) => {
      focusListeners.add(listener);
      return () => void focusListeners.delete(listener);
    },
    setItems: (next: ReadonlyArray<string>) => {
      items = next;
      positions = new Map(next.map((id, index) => [id, index]));
      const ids = [...state.ids].filter((id) => positions.has(id));
      const anchor = present(state.anchor);
      const focus = present(state.focus);
      if (ids.length === state.ids.size && anchor === state.anchor && focus === state.focus) return;
      commit({ ids: new Set(ids), anchor, focus });
    },
    select: (index: number, { toggle, extend }: Modifiers) => {
      const id = items[index];
      if (id === undefined) return;
      const anchor = state.anchor === undefined ? undefined : positions.get(state.anchor);
      if (extend && anchor !== undefined) {
        const range = items.slice(Math.min(anchor, index), Math.max(anchor, index) + 1);
        commit({ ids: new Set(toggle ? [...state.ids, ...range] : range), anchor: state.anchor, focus: id });
      } else if (toggle) {
        const ids = new Set(state.ids);
        if (!ids.delete(id)) ids.add(id);
        commit({ ids, anchor: id, focus: id });
      } else commit(only(id));
    },
    selectAll: () => {
      if (state.ids.size < items.length) commit({ ...state, ids: new Set(items) });
    },
    clear: () => {
      if (state.ids.size > 0) commit({ ids: EMPTY.ids, anchor: undefined, focus: state.focus });
    },
    follow: (id: string) => {
      if (!positions.has(id) || (state.focus === id && state.ids.has(id))) return;
      commit(state.ids.has(id) ? { ...state, focus: id } : only(id));
    },
    has: (id: string) => state.ids.has(id),
    sole: () => (state.ids.size === 1 ? state.ids.values().next().value : undefined),
    selectedCount: () => state.ids.size,
    itemCount: () => items.length,
    focusIndex: () => (state.focus === undefined ? -1 : (positions.get(state.focus) ?? -1)),
  };
};

export type SelectionStore = ReturnType<typeof createSelection>;

export const useIsSelected = (selection: SelectionStore, id: string) =>
  useSyncExternalStore(selection.subscribe, () => selection.has(id));

export const useSelectedCount = (selection: SelectionStore) =>
  useSyncExternalStore(selection.subscribe, selection.selectedCount);

export const useRevealFocus = (selection: SelectionStore, reveal: (index: number) => void, ready = true) => {
  const onFocus = useEffectEvent(reveal);
  useEffect(() => {
    if (!ready) return;
    const index = selection.focusIndex();
    if (index >= 0) onFocus(index);
    return selection.subscribeFocus((focused) => onFocus(focused));
  }, [selection, ready]);
};

export const useFollow = (
  selection: SelectionStore,
  entries: ReadonlyArray<Entry> | undefined,
  ref: EntryRef | null,
) => {
  const key = ref && entryKey(ref);
  const entry = key ? entries?.find((candidate) => entryKey(candidate.ref) === key) : undefined;
  const id = entry && selectionId(entry);
  useLayoutEffect(() => {
    if (id) selection.follow(id);
  }, [selection, id]);
};
