import type { IconSvgElement } from "@hugeicons/react";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
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
    className={cn("flex h-7 items-center gap-0.5 rounded-md bg-hover p-0.5", className)}
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
        "flex h-6 min-w-6 items-center justify-center rounded px-1 text-muted focus-ring",
        "transition-colors duration-100 hover:text-fg",
        "data-[pressed]:bg-panel data-[pressed]:text-fg data-[pressed]:shadow-xs",
      )}
    >
      <Icon icon={icon} size={14} />
    </Toggle>
  </Tooltip>
);
