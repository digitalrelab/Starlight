import { cn } from "cn";
import type { ComponentProps } from "react";

export const Badge = ({ className, ...props }: ComponentProps<"span">) => (
  <span
    className={cn("inline-flex h-5 items-center rounded-sm bg-neutral px-1.5 text-xs text-subtle", className)}
    {...props}
  />
);
