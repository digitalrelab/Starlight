import type { ReactNode } from "react";
import { FULL_PERCENT } from "./pace.ts";

const SERIES_COLORS = ["var(--background-color-series-1)", "var(--background-color-series-2)"];
const OTHER_COLOR = "var(--background-color-series-other)";

export const seriesColor = (index: number) => SERIES_COLORS[index] ?? OTHER_COLOR;

const PERCENT_TICKS = [0, 50, FULL_PERCENT];

export interface Inset {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export interface PercentScale {
  readonly width: number;
  readonly height: number;
  readonly inset: Inset;
  readonly y: (percent: number) => number;
}

export const percentScale = (width: number, height: number, inset: Inset): PercentScale => ({
  width,
  height,
  inset,
  y: (percent) => inset.top + (1 - percent / FULL_PERCENT) * (height - inset.top - inset.bottom),
});

export const PercentGrid = ({ scale: { width, inset, y } }: { readonly scale: PercentScale }) =>
  PERCENT_TICKS.map((percent) => (
    <g key={percent}>
      <line
        x1={inset.left}
        x2={width - inset.right}
        y1={y(percent)}
        y2={y(percent)}
        className="stroke-(--border-color-default)"
      />
      <text
        x={inset.left - 8}
        y={y(percent)}
        dy="0.32em"
        textAnchor="end"
        className="fill-(--text-color-subtlest) text-xs"
      >
        {percent}%
      </text>
    </g>
  ));

export const Swatch = ({ color }: { readonly color: string }) => (
  <span className="size-2 shrink-0 rounded-xs" style={{ background: color }} />
);

export const Legend = ({
  labels,
  colorOf,
}: {
  readonly labels: ReadonlyArray<string>;
  readonly colorOf: (label: string) => string;
}) => (
  <div className="flex flex-wrap gap-x-4 text-sm text-subtle">
    {labels.map((label) => (
      <span key={label} className="flex items-center gap-1.5">
        <Swatch color={colorOf(label)} />
        {label}
      </span>
    ))}
  </div>
);

interface TooltipProps {
  readonly x: number;
  readonly width: number;
  readonly title: string;
  readonly children: ReactNode;
}

export const ChartTooltip = ({ x, width, title, children }: TooltipProps) => (
  <div
    className="pointer-events-none absolute top-0 z-10 flex min-w-36 flex-col gap-0.5 rounded-md bg-surface-overlay px-2 py-1.5 text-sm shadow-overlay"
    style={x < width / 2 ? { left: x + 12 } : { right: width - x + 12 }}
  >
    <span className="text-subtle">{title}</span>
    {children}
  </div>
);

export const TooltipRow = ({
  color,
  label,
  value,
}: {
  readonly color?: string;
  readonly label: string;
  readonly value: string;
}) => (
  <div className="flex items-center gap-2">
    {color ? <Swatch color={color} /> : null}
    <span className={color ? undefined : "text-subtle"}>{label}</span>
    <span className="ml-auto pl-4 font-medium tabular-nums">{value}</span>
  </div>
);
