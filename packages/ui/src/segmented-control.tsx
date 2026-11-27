import type { IconSvgElement } from "@hugeicons/react";
import { Toggle, ToggleGroup } from "@base-ui/react";
import { cn } from "cn";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "./icon.tsx";
import { Tooltip } from "./tooltip.tsx";

export interface SegmentedControlProps<Value extends string> {
  readonly value: Value;
  readonly onValueChange: (value: Value) => void;
  readonly children: ReactNode;
  readonly "aria-label": string;
  readonly className?: string;
}

interface Slot {
  readonly left: number;
  readonly width: number;
}

export const SegmentedControl = <Value extends string>({
  value,
  onValueChange,
  className,
  children,
  ...props
}: SegmentedControlProps<Value>) => {
  const ref = useRef<HTMLDivElement>(null);
  const [slot, setSlot] = useState<Slot | null>(null);

  useLayoutEffect(() => {
    const group = ref.current;
    if (!group) return;
    const measure = () => {
      const pressed = group.querySelector<HTMLElement>("[data-pressed]");
      setSlot(pressed ? { left: pressed.offsetLeft, width: pressed.offsetWidth } : null);
    };
    measure();
    const resizes = new ResizeObserver(measure);
    const presses = new MutationObserver(measure);
    resizes.observe(group);
    presses.observe(group, { subtree: true, attributeFilter: ["data-pressed"] });
    return () => {
      resizes.disconnect();
      presses.disconnect();
    };
  }, []);

  return (
    <ToggleGroup<Value>
      ref={ref}
      value={[value]}
      onValueChange={([next]) => {
        if (next !== undefined) onValueChange(next);
      }}
      className={cn("relative flex h-control items-center gap-0.5 rounded-md bg-neutral p-0.5", className)}
      {...props}
    >
      {slot ? (
        <span
          aria-hidden
          className="absolute inset-y-0.5 left-0 rounded-sm bg-surface-raised shadow-xs transition-[translate,width] duration-200 ease-out motion-reduce:transition-none"
          style={{ width: slot.width, translate: `${slot.left}px 0` }}
        />
      ) : null}
      {children}
    </ToggleGroup>
  );
};

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
        "relative flex h-control-sm min-w-control-sm items-center justify-center rounded-sm px-1 text-subtle focus-ring",
        "transition-colors hover:text-default data-[pressed]:text-default",
      )}
    >
      <Icon icon={icon} size={14} />
    </Toggle>
  </Tooltip>
);
