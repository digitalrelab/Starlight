import type { ResizeHandleProps } from "@starlight/ui";
import { defineStored, json } from "#renderer/lib/storage.ts";
import { useStore } from "#renderer/lib/store.ts";

type PaneWidth = Pick<ResizeHandleProps, "size" | "min" | "max" | "onResize" | "onReset">;

interface Bounds {
  readonly min: number;
  readonly max: number;
  readonly fallback: number;
}

type Widths = Readonly<Record<string, number>>;

const COLUMN: Bounds = { min: 180, max: 560, fallback: 260 };
const PREVIEW: Bounds = { min: 280, max: 720, fallback: 340 };

const toWidths = (value: unknown): Widths =>
  typeof value === "object" && value !== null
    ? Object.fromEntries(Object.entries(value).filter(([, width]) => typeof width === "number"))
    : {};

const widths = defineStored("panel.widths", json(toWidths), {});

const paneWidth = (all: Widths, slot: string, { min, max, fallback }: Bounds): PaneWidth => ({
  min,
  max,
  size: Math.min(max, Math.max(min, all[slot] ?? fallback)),
  onResize: (size) => widths.set({ ...widths.get(), [slot]: size }),
  onReset: () => {
    const { [slot]: _removed, ...rest } = widths.get();
    widths.set(rest);
  },
});

export const usePaneWidths = () => {
  const all = useStore(widths);
  return {
    column: (depth: number) => paneWidth(all, String(depth), COLUMN),
    preview: paneWidth(all, "preview", PREVIEW),
  };
};
