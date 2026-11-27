import { Popover as BasePopover } from "@base-ui/react";
import type { ComponentProps } from "react";
import { cn } from "cn";
import { popupSurface } from "./popup.ts";

export const Popover = BasePopover.Root;
export const PopoverTrigger = BasePopover.Trigger;

type PositionerProps = ComponentProps<typeof BasePopover.Positioner>;

export interface PopoverContentProps extends Omit<ComponentProps<typeof BasePopover.Popup>, "className"> {
  readonly side?: PositionerProps["side"];
  readonly align?: PositionerProps["align"];
  readonly className?: string;
}

export const PopoverContent = ({ side, align, className, ...props }: PopoverContentProps) => (
  <BasePopover.Portal>
    <BasePopover.Positioner
      side={side}
      align={align}
      sideOffset={6}
      collisionPadding={8}
      className="z-floating"
    >
      <BasePopover.Popup
        className={cn(
          popupSurface,
          "flex max-h-(--available-height) flex-col overflow-hidden p-3 text-default",
          className,
        )}
        {...props}
      />
    </BasePopover.Positioner>
  </BasePopover.Portal>
);
