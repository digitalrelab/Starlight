import { cn } from "cn";

export interface ProgressRingProps {
  readonly value: number;
  readonly label: string;
  readonly className?: string;
}

export const ProgressRing = ({ value, label, className }: ProgressRingProps) => (
  <svg
    viewBox="0 0 32 32"
    role="progressbar"
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={1}
    aria-valuenow={value}
    className={cn("-rotate-90", className)}
  >
    <circle cx="16" cy="16" r="15" fill="none" strokeWidth="2" className="stroke-current opacity-20" />
    <circle
      cx="16"
      cy="16"
      r="15"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - value}
      className="stroke-current transition-[stroke-dashoffset] duration-500"
    />
  </svg>
);
