import type { Entry } from "@starlight/client";
import type { LayoutProps } from "./types.ts";

export type ItemHandlers = Pick<LayoutProps, "onSelect" | "onHover" | "onOpen">;

export const itemEvents = (index: number, entry: Entry, { onSelect, onHover, onOpen }: ItemHandlers) => ({
  onClick: () => onSelect(index),
  onDoubleClick: () => onOpen(entry),
  onPointerEnter: () => onHover(index),
  onPointerLeave: () => onHover(null),
});
