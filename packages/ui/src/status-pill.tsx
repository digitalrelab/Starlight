import { cn } from "cn";
import type { ReactNode } from "react";

const tones = {
  neutral: "bg-neutral text-subtle",
  brand: "bg-brand-subtlest text-brand",
  success: "bg-success text-success",
  warning: "bg-warning text-warning",
  danger: "bg-danger text-danger",
} as const;

export type StatusTone = keyof typeof tones;

export interface StatusPillProps {
  readonly tone: StatusTone;
  readonly pulse?: boolean;
  readonly children: ReactNode;
}

export const StatusPill = ({ tone, pulse, children }: StatusPillProps) => (
  <span className={cn("inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-xs", tones[tone])}>
    <span className={cn("size-1.5 rounded-full bg-current", pulse && "animate-pulse")} />
    {children}
  </span>
);
