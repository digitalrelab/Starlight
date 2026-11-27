import { Tooltip as BaseTooltip } from "@base-ui/react";
import type { ReactElement } from "react";
import { cn } from "cn";
import { Kbd, type Shortcut } from "./kbd.tsx";
import { scaleMotion } from "./popup.ts";

export const TooltipProvider = BaseTooltip.Provider;

interface Props {
  readonly label: string;
  readonly shortcut?: Shortcut | undefined;
  readonly side?: "top" | "right" | "bottom" | "left";
  readonly children: ReactElement;
}

export const Tooltip = ({ label, shortcut, side = "top", children }: Props) => (
  <BaseTooltip.Root>
    <BaseTooltip.Trigger render={children} />
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner side={side} sideOffset={6} className="z-tooltip">
        <BaseTooltip.Popup
          className={cn(
            scaleMotion,
            "flex origin-(--transform-origin) items-center gap-2 rounded-md bg-surface-overlay px-2 py-1 text-sm text-default shadow-overlay data-[instant]:transition-none",
          )}
        >
          {label}
          {shortcut ? <Kbd shortcut={shortcut} /> : null}
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  </BaseTooltip.Root>
);
