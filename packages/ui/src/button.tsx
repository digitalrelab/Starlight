import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps } from "react";
import { cn } from "cn";

const variants = {
  primary: "bg-accent text-accent-fg hover:brightness-110",
  ghost: "text-fg hover:bg-hover",
} as const;

export interface ButtonProps extends Omit<ComponentProps<typeof BaseButton>, "className"> {
  readonly variant?: keyof typeof variants;
  readonly className?: string;
}

export const Button = ({ variant = "ghost", className, ...props }: ButtonProps) => (
  <BaseButton
    className={cn(
      "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium select-none",
      "transition-[background-color,filter] duration-100 focus-ring data-[disabled]:opacity-50",
      variants[variant],
      className,
    )}
    {...props}
  />
);
