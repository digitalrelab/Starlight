import { ArrowDown01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { Collapsible as BaseCollapsible } from "@base-ui/react";
import { cn } from "cn";
import type { ComponentProps } from "react";
import { Icon } from "./icon.tsx";

interface TriggerProps extends Omit<ComponentProps<typeof BaseCollapsible.Trigger>, "className"> {
  readonly className?: string;
}

const Trigger = ({ className, ...props }: TriggerProps) => (
  <BaseCollapsible.Trigger className={cn("group", className)} {...props} />
);

interface PanelProps extends Omit<ComponentProps<typeof BaseCollapsible.Panel>, "className"> {
  readonly className?: string;
}

const Panel = ({ className, ...props }: PanelProps) => (
  <BaseCollapsible.Panel
    className={cn(
      "h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0",
      className,
    )}
    {...props}
  />
);

const Indicator = () => (
  <Icon
    icon={ArrowDown01Icon}
    className="text-subtle transition-transform duration-200 group-data-[panel-open]:rotate-180"
  />
);

export const Collapsible = {
  Root: BaseCollapsible.Root,
  Trigger,
  Panel,
  Indicator,
};
