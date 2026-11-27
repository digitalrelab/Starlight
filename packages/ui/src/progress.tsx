import { Progress as BaseProgress } from "@base-ui/react/progress";
import { cn } from "cn";

export interface ProgressProps {
  readonly value: number;
  readonly label: string;
  readonly className?: string;
}

export const Progress = ({ value, label, className }: ProgressProps) => (
  <BaseProgress.Root value={value} max={1} aria-label={label} className={cn("w-full", className)}>
    <BaseProgress.Track className="h-1 overflow-hidden rounded-full bg-neutral-subtle-hovered">
      <BaseProgress.Indicator className="block h-full rounded-full bg-brand-bold transition-[width] duration-500" />
    </BaseProgress.Track>
  </BaseProgress.Root>
);
