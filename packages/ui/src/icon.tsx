import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";
import { cn } from "cn";

export type IconProps = HugeiconsIconProps;

export const Icon = ({ size = 16, strokeWidth = 1.5, className, ...props }: IconProps) => (
  <HugeiconsIcon size={size} strokeWidth={strokeWidth} className={cn("shrink-0", className)} {...props} />
);
