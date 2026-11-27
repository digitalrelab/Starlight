import { Switch as BaseSwitch } from "@base-ui/react";
import type { ComponentProps } from "react";
import { cn } from "cn";

export interface SwitchProps extends Omit<ComponentProps<typeof BaseSwitch.Root>, "className"> {
  readonly className?: string;
}

export const Switch = ({ className, ...props }: SwitchProps) => (
  <BaseSwitch.Root
    className={cn(
      "inline-flex h-5 w-8 shrink-0 items-center rounded-full bg-neutral-bold p-0.5 transition-colors",
      "focus-ring data-[checked]:bg-brand-bold data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <BaseSwitch.Thumb className="size-4 rounded-full bg-white shadow-xs transition-transform data-[checked]:translate-x-3" />
  </BaseSwitch.Root>
);
