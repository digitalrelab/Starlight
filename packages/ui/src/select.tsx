import { ArrowDown01Icon, Tick02Icon } from "@hugeicons-pro/core-stroke-rounded";
import { Select as BaseSelect } from "@base-ui/react";
import type { ReactElement, ReactNode } from "react";
import { cn } from "cn";
import { Icon } from "./icon.tsx";
import { popupSurface } from "./popup.ts";

interface RootProps<Value extends string> {
  readonly value: Value;
  readonly onValueChange: (value: Value) => void;
  readonly children: ReactNode;
}

const Root = <Value extends string>({ value, onValueChange, children }: RootProps<Value>) => (
  <BaseSelect.Root<Value> value={value} onValueChange={(next) => next !== null && onValueChange(next)}>
    {children}
  </BaseSelect.Root>
);

interface TriggerProps {
  readonly id?: string;
  readonly render: ReactElement;
  readonly children: ReactNode;
}

const Trigger = ({ id, render, children }: TriggerProps) => (
  <BaseSelect.Trigger id={id} render={render}>
    <BaseSelect.Value className="flex items-center">{children}</BaseSelect.Value>
    <Icon icon={ArrowDown01Icon} size={14} className="ml-1 text-subtlest" />
  </BaseSelect.Trigger>
);

const Popup = ({ children }: { readonly children: ReactNode }) => (
  <BaseSelect.Portal>
    <BaseSelect.Positioner className="z-overlay outline-none">
      <BaseSelect.Popup className={cn(popupSurface, "min-w-(--anchor-width) p-1.5")}>
        <BaseSelect.List>{children}</BaseSelect.List>
      </BaseSelect.Popup>
    </BaseSelect.Positioner>
  </BaseSelect.Portal>
);

interface ItemProps<Value extends string> {
  readonly value: Value;
  readonly children: ReactNode;
}

const Item = <Value extends string>({ value, children }: ItemProps<Value>) => (
  <BaseSelect.Item
    value={value}
    className="flex min-h-8 items-center rounded-md px-2 text-subtle outline-none data-[highlighted]:bg-neutral data-[selected]:text-default"
  >
    <BaseSelect.ItemText className="flex items-center">{children}</BaseSelect.ItemText>
    <BaseSelect.ItemIndicator className="ml-auto pl-4 text-subtle">
      <Icon icon={Tick02Icon} />
    </BaseSelect.ItemIndicator>
  </BaseSelect.Item>
);

export const Select = { Root, Trigger, Popup, Item };
