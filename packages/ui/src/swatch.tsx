import { cn } from "cn";
import type { ComponentProps } from "react";

export interface SwatchProps extends ComponentProps<"span"> {
  readonly color: string;
}

export const Swatch = ({ color, className, style, ...props }: SwatchProps) => (
  <span
    className={cn(
      "inline-block size-5 shrink-0 squircle border border-default bg-linear-to-b from-white/25 to-transparent bg-clip-padding",
      className,
    )}
    style={{ ...style, backgroundColor: color }}
    {...props}
  />
);
