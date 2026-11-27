import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";

export type IconProps = HugeiconsIconProps;

export const Icon = ({ size = 16, strokeWidth = 1.5, ...props }: IconProps) => (
  <HugeiconsIcon size={size} strokeWidth={strokeWidth} {...props} />
);
