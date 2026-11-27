import { cn } from "cn";
import type { PointerEvent, ReactNode } from "react";
import { popupSurface } from "./popup.ts";

export const listPopup = cn(popupSurface, "min-w-48 max-w-80");

export const listBody = "flex flex-col p-1.5";

export const listGroupLabel = "flex h-7 items-center px-2 text-sm text-subtlest";

export const listItem =
  "flex min-h-8 shrink-0 items-center gap-2 rounded-md px-2 text-subtle outline-none select-none data-[highlighted]:bg-neutral data-[highlighted]:text-default";

export const ItemHint = ({ children }: { readonly children: ReactNode }) => (
  <span className="ml-auto shrink-0 pl-4 text-sm text-subtlest tabular-nums">{children}</span>
);

export const highlightable = (highlighted: boolean, highlight: () => void) => ({
  "data-highlighted": highlighted || undefined,
  onPointerMove: ({ movementX, movementY }: PointerEvent) => {
    if (!highlighted && (movementX !== 0 || movementY !== 0)) highlight();
  },
});
