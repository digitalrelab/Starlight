import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ReactElement } from "react";

export const TooltipProvider = BaseTooltip.Provider;

interface Props {
  readonly label: string;
  readonly side?: "top" | "right" | "bottom" | "left";
  readonly children: ReactElement;
}

export const Tooltip = ({ label, side = "top", children }: Props) => (
  <BaseTooltip.Root>
    <BaseTooltip.Trigger render={children} />
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner side={side} sideOffset={6}>
        <BaseTooltip.Popup className="origin-(--transform-origin) rounded-md border border-border bg-panel px-2 py-1 text-[12px] text-fg shadow-md transition-[opacity,scale] duration-100 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[instant]:transition-none data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          {label}
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  </BaseTooltip.Root>
);
