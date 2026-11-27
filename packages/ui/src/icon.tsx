import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";
import { cn } from "cn";

export type IconProps = HugeiconsIconProps;

export const Icon = ({ size = 16, className, ...props }: IconProps) => (
  <HugeiconsIcon size={size} className={cn("shrink-0", className)} {...props} />
);
