import { cn } from "cn";
import { scaleMotion } from "./popup.ts";

const timing = "duration-200 data-[ending-style]:duration-150 data-[ending-style]:ease-in";

export const dialogBackdrop = cn(
  "fixed inset-0 z-overlay bg-blanket transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
  timing,
);

export const dialogViewport =
  "fixed inset-0 z-overlay flex flex-col items-center p-4 before:max-h-[clamp(0rem,12vh_-_1rem,7rem)] before:grow after:grow";

export const dialogPopup = cn(
  "flex max-w-full flex-col overflow-hidden rounded-xl bg-surface-overlay shadow-overlay outline-none",
  scaleMotion,
  timing,
);

export const dialogRows =
  "flex flex-col gap-0.5 px-[calc(var(--spacing-dialog)-var(--spacing-dialog-row))] pb-2";

const row = "flex h-11 w-full shrink-0 items-center gap-3 rounded-md px-dialog-row text-left outline-none";

export const dialogRow = cn(
  row,
  "highlighted:wash-neutral-subtle-hovered focus-visible:ring-2 focus-visible:ring-selected focus-visible:ring-inset",
);

export const dialogOption = cn(row, "scroll-my-2 data-highlighted:wash-neutral-subtle-hovered");
