import { Popover as BasePopover } from "@base-ui/react/popover";
import type { ComponentProps } from "react";
import { cn } from "cn";

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
    <BasePopover.Positioner side={side} align={align} sideOffset={6} collisionPadding={8}>
      <BasePopover.Popup
        className={cn(
          "max-h-(--available-height) origin-(--transform-origin) overflow-y-auto rounded-lg border border-border",
          "bg-panel p-3 text-fg shadow-lg outline-none transition-[opacity,scale] duration-150",
          "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
          "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
          className,
        )}
        {...props}
      />
    </BasePopover.Positioner>
  </BasePopover.Portal>
);
