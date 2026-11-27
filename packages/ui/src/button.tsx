import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps } from "react";
import { cn } from "cn";

export interface ButtonProps extends Omit<ComponentProps<typeof BaseButton>, "className"> {
  readonly className?: string;
}

export const Button = ({ className, ...props }: ButtonProps) => (
  <BaseButton
    className={cn(
      "inline-flex h-control items-center gap-1.5 rounded-md px-2.5 text-base font-medium text-default select-none",
      "transition-colors hover:bg-neutral-subtle-hovered focus-ring data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  />
);
