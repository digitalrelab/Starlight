import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps } from "react";
import { cn } from "cn";

const intents = {
  ghost: "text-default highlighted:bg-neutral-subtle-hovered",
  secondary:
    "border border-input bg-surface-raised text-default shadow-xs highlighted:wash-neutral-subtle-hovered",
} as const;

export interface ButtonProps extends Omit<ComponentProps<typeof BaseButton>, "className"> {
  readonly intent?: keyof typeof intents;
  readonly className?: string;
}

export const Button = ({ intent = "ghost", className, ...props }: ButtonProps) => (
  <BaseButton
    className={cn(
      "inline-flex h-control items-center gap-1.5 rounded-md px-2.5 text-base select-none",
      "transition-colors focus-ring data-[disabled]:opacity-50",
      intents[intent],
      className,
    )}
    {...props}
  />
);
