import { cn } from "cn";
import type { CSSProperties } from "react";

export interface ShimmerProps {
  readonly children: string;
  readonly className?: string | undefined;
  readonly duration?: number;
  readonly spread?: number;
}

export const Shimmer = ({ children, className, duration = 2, spread = 2 }: ShimmerProps) => (
  <span
    className={cn("inline-block shimmer", className)}
    style={
      {
        "--shimmer-duration": `${duration}s`,
        "--shimmer-spread": `${children.length * spread}px`,
      } as CSSProperties
    }
  >
    {children}
  </span>
);
