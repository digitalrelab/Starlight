import type { IconSvgElement } from "@hugeicons/react";
import { Toggle, ToggleGroup } from "@base-ui/react";
import { cn } from "cn";
import type { ReactNode } from "react";
import { Icon } from "./icon.tsx";
import { Tooltip } from "./tooltip.tsx";

export interface SegmentedControlProps<Value extends string> {
  readonly value: Value;
  readonly onValueChange: (value: Value) => void;
  readonly children: ReactNode;
  readonly "aria-label": string;
  readonly className?: string;
}

export const SegmentedControl = <Value extends string>({
  value,
  onValueChange,
  className,
  ...props
}: SegmentedControlProps<Value>) => (
  <ToggleGroup<Value>
    value={[value]}
    onValueChange={([next]) => {
      if (next !== undefined) onValueChange(next);
    }}
    className={cn("flex h-control items-center gap-0.5 rounded-md bg-neutral p-0.5", className)}
    {...props}
  />
);

export interface SegmentedControlItemProps<Value extends string> {
  readonly value: Value;
  readonly icon: IconSvgElement;
  readonly label: string;
}

export const SegmentedControlItem = <Value extends string>({
  value,
  icon,
  label,
}: SegmentedControlItemProps<Value>) => (
  <Tooltip label={label}>
    <Toggle<Value>
      value={value}
      aria-label={label}
      className={cn(
        "flex h-control-sm min-w-control-sm items-center justify-center rounded-sm px-1 text-subtle focus-ring",
        "transition-colors hover:text-default",
        "data-[pressed]:bg-surface-raised data-[pressed]:text-default data-[pressed]:shadow-xs",
      )}
    >
      <Icon icon={icon} size={14} />
    </Toggle>
  </Tooltip>
);
