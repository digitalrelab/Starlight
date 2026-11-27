import type { Entry } from "@starlight/client";
import type { KeyboardEvent, MouseEvent } from "react";
import { type Modifiers, selectionId, useIsSelected } from "#renderer/features/browser/selection.ts";
import type { LayoutProps } from "./types.ts";

export type ItemHandlers = Pick<LayoutProps, "selection" | "onHover" | "onOpen">;

export type Step = (from: number, key: string) => number | undefined;

const modifiersOf = (event: MouseEvent): Modifiers => ({
  toggle: event.metaKey || event.ctrlKey,
  extend: event.shiftKey,
});

const isPlain = (event: MouseEvent) => !event.metaKey && !event.ctrlKey && !event.shiftKey;

export const useItem = (index: number, entry: Entry, { selection, onHover, onOpen }: ItemHandlers) => {
  const selected = useIsSelected(selection, selectionId(entry));
  return {
    selected,
    props: {
      role: "option",
      "aria-selected": selected,
      "data-index": index,
      onClick: (event: MouseEvent) => selection.select(index, modifiersOf(event)),
      onDoubleClick: (event: MouseEvent) => {
        if (isPlain(event)) onOpen(entry);
      },
      onPointerEnter: () => onHover(index),
      onPointerLeave: () => onHover(null),
    },
  };
};

const targetOf = (key: string, from: number, last: number, step: Step) => {
  if (key === "Home") return 0;
  if (key === "End") return last;
  if (from < 0) return step(0, key) === undefined ? undefined : 0;
  return step(from, key);
};

type ListHandlers = Pick<LayoutProps, "entries" | "selection" | "onOpen">;

const open = ({ entries, selection, onOpen }: ListHandlers) => {
  const entry = entries[selection.focusIndex()];
  if (entry && selection.has(selectionId(entry))) onOpen(entry);
};

const onListKey = (event: KeyboardEvent, list: ListHandlers, step: Step) => {
  const { selection } = list;
  const mod = event.metaKey || event.ctrlKey;
  if (event.key === "Enter") open(list);
  else if (mod && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "a") selection.selectAll();
  else if (event.key === "Escape" && selection.selectedCount() > 0) selection.clear();
  else {
    if (mod || event.altKey) return;
    const from = selection.focusIndex();
    const last = selection.itemCount() - 1;
    const target = targetOf(event.key, from, last, step);
    if (target === undefined) return;
    const to = Math.max(0, Math.min(last, target));
    if (to !== from) selection.select(to, { toggle: false, extend: event.shiftKey });
  }
  event.preventDefault();
};

export const isOnItem = (target: EventTarget) =>
  target instanceof Element && target.closest("[data-index]") !== null;

export const listOf = (element: Element) => element.closest<HTMLElement>("[role=listbox]");

export const listProps = (list: ListHandlers, step: Step) => ({
  tabIndex: 0,
  role: "listbox",
  "aria-multiselectable": true,
  onKeyDown: (event: KeyboardEvent) => onListKey(event, list, step),
  onClick: (event: MouseEvent) => {
    if (!isOnItem(event.target) && isPlain(event)) list.selection.clear();
  },
});
