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
    <BasePopover.Positioner
      side={side}
      align={align}
      sideOffset={6}
      collisionPadding={8}
      className="z-floating"
    >
      <BasePopover.Popup
        className={cn(
          "flex max-h-(--available-height) origin-(--transform-origin) flex-col overflow-hidden rounded-lg p-3",
          "bg-surface-overlay text-default shadow-overlay outline-none transition-[opacity,scale]",
          "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
          "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
          className,
        )}
        {...props}
      />
    </BasePopover.Positioner>
  </BasePopover.Portal>
);
