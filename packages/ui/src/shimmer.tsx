import { cn } from "cn";
import type { CSSProperties } from "react";

export interface ShimmerProps {
  readonly children: string;
  readonly className?: string | undefined;
}

export const Shimmer = ({ children, className }: ShimmerProps) => (
  <span className={cn("shimmer", className)} style={{ "--shimmer-length": children.length } as CSSProperties}>
    {children}
  </span>
);
