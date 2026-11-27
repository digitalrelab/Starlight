import type { UsagePoint, UsageSeries } from "@starlight/client";
import { type PointerEvent, useRef, useState } from "react";
import { formatDayTime, formatWeekday } from "#renderer/lib/format.ts";
import { useElementWidth } from "#renderer/lib/use-element-width.ts";
import {
  ChartTooltip,
  type Inset,
  PercentGrid,
  type PercentScale,
  percentScale,
  TooltipRow,
} from "./chart.tsx";
import { FULL_PERCENT } from "./pace.ts";

const HEIGHT = 168;
const INSET: Inset = { top: 10, right: 40, bottom: 24, left: 40 };
const END_LABEL_GAP = 12;
const DAY_LABEL_SHARE = 0.5;

interface TimeScale extends PercentScale {
  readonly start: number;
  readonly durationMs: number;
  readonly x: (at: number) => number;
  readonly at: (x: number) => number;
}

interface SeriesProps {
  readonly series: ReadonlyArray<UsageSeries>;
  readonly colorOf: (label: string) => string;
}

const valueAt = (points: ReadonlyArray<UsagePoint>, at: number) => {
  const index = points.findIndex((point) => point.at >= at);
  const next = points[index];
  const previous = points[index - 1];
  if (!next) return points.at(-1)?.usedPercent ?? 0;
  if (!previous) return next.usedPercent;
  return (
    previous.usedPercent +
    ((next.usedPercent - previous.usedPercent) * (at - previous.at)) / (next.at - previous.at)
  );
};

const dayLabels = ({ start, durationMs, x }: TimeScale) => {
  const end = start + durationMs;
  const labels: Array<{ readonly x: number; readonly text: string }> = [];
  const day = new Date(start);
  day.setHours(0, 0, 0, 0);
  while (day.getTime() < end) {
    const midnight = day.getTime();
    day.setDate(day.getDate() + 1);
    const from = Math.max(midnight, start);
    const to = Math.min(day.getTime(), end);
    if ((to - from) / (day.getTime() - midnight) >= DAY_LABEL_SHARE) {
      labels.push({ x: (x(from) + x(to)) / 2, text: formatWeekday(midnight) });
    }
  }
  return labels;
};

const spread = <A extends { readonly y: number }>(labels: ReadonlyArray<A>) =>
  [...labels]
    .sort((a, b) => a.y - b.y)
    .reduce<Array<A>>((placed, label) => {
      const above = placed.at(-1);
      placed.push(
        above && label.y - above.y < END_LABEL_GAP ? { ...label, y: above.y + END_LABEL_GAP } : label,
      );
      return placed;
    }, []);

const Crosshair = ({ scale, series, colorOf }: SeriesProps & { readonly scale: TimeScale }) => {
  const [at, setAt] = useState<number | null>(null);
  const from = Math.min(...series.map(({ points }) => points[0]?.at ?? Infinity));
  const to = Math.max(...series.map(({ points }) => points.at(-1)?.at ?? -Infinity));

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const offset = event.clientX - event.currentTarget.getBoundingClientRect().left;
    setAt(Math.min(Math.max(scale.at(offset), from), to));
  };

  const x = at === null ? 0 : scale.x(at);
  return (
    <div className="absolute inset-0" onPointerMove={onPointerMove} onPointerLeave={() => setAt(null)}>
      {at === null ? null : (
        <>
          <div
            className="pointer-events-none absolute w-px bg-(--border-color-input-hovered)"
            style={{ left: x, top: scale.inset.top, bottom: scale.inset.bottom }}
          />
          {series.map(({ label, points }) => (
            <div
              key={label}
              className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-(--background-color-surface-raised)"
              style={{ left: x, top: scale.y(valueAt(points, at)), background: colorOf(label) }}
            />
          ))}
          <ChartTooltip x={x} width={scale.width} title={formatDayTime(at)}>
            {series.map(({ label, points }) => (
              <TooltipRow
                key={label}
                color={colorOf(label)}
                label={label}
                value={`${Math.round(valueAt(points, at))}%`}
              />
            ))}
            <TooltipRow
              label="Even pace"
              value={`${Math.round(((at - scale.start) / scale.durationMs) * FULL_PERCENT)}%`}
            />
          </ChartTooltip>
        </>
      )}
    </div>
  );
};

interface Props extends SeriesProps {
  readonly resetsAt: number;
  readonly durationMs: number;
  readonly now: number;
}

export const WindowChart = ({ resetsAt, durationMs, series, colorOf, now }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const width = useElementWidth(ref);

  const start = resetsAt - durationMs;
  const span = width - INSET.left - INSET.right;
  const scale: TimeScale = {
    ...percentScale(width, HEIGHT, INSET),
    start,
    durationMs,
    x: (at) => INSET.left + ((at - start) / durationMs) * span,
    at: (x) => start + ((x - INSET.left) / span) * durationMs,
  };

  const lines = series.map(({ label, points }) => ({
    label,
    first: points[0],
    last: points.at(-1),
    path: points
      .map(({ at, usedPercent }, index) => `${index ? "L" : "M"}${scale.x(at)} ${scale.y(usedPercent)}`)
      .join(""),
  }));

  const [only] = lines.length === 1 ? lines : [];
  const ends = spread(
    lines.flatMap(({ last }) =>
      last
        ? [{ x: scale.x(last.at), y: scale.y(last.usedPercent), text: `${Math.round(last.usedPercent)}%` }]
        : [],
    ),
  );

  return (
    <div ref={ref} className="relative" style={{ height: HEIGHT }}>
      {width > 0 ? (
        <>
          <svg width={width} height={HEIGHT} className="overflow-visible">
            <PercentGrid scale={scale} />
            {dayLabels(scale).map(({ x, text }) => (
              <text
                key={x}
                x={x}
                y={HEIGHT - 6}
                textAnchor="middle"
                className="fill-(--text-color-subtlest) text-xs"
              >
                {text}
              </text>
            ))}
            <line
              x1={scale.x(scale.start)}
              y1={scale.y(0)}
              x2={scale.x(resetsAt)}
              y2={scale.y(FULL_PERCENT)}
              className="stroke-(--text-color-subtlest)"
              strokeDasharray="2 4"
              strokeLinecap="round"
            />
            <line
              x1={scale.x(now)}
              x2={scale.x(now)}
              y1={INSET.top}
              y2={HEIGHT - INSET.bottom}
              className="stroke-(--border-color-input)"
            />
            {only?.first && only.last ? (
              <path
                d={`${only.path}L${scale.x(only.last.at)} ${scale.y(0)}L${scale.x(only.first.at)} ${scale.y(0)}Z`}
                fill={colorOf(only.label)}
                opacity={0.1}
              />
            ) : null}
            {lines.map(({ label, path }) => (
              <path
                key={label}
                d={path}
                fill="none"
                stroke={colorOf(label)}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
            {lines.map(({ label, last }) =>
              last ? (
                <circle
                  key={label}
                  cx={scale.x(last.at)}
                  cy={scale.y(last.usedPercent)}
                  r={4}
                  fill={colorOf(label)}
                  strokeWidth={2}
                  className="stroke-(--background-color-surface-raised)"
                />
              ) : null,
            )}
            {ends.map(({ x, y, text }) => (
              <text
                key={`${y}${text}`}
                x={x + 9}
                y={y}
                dy="0.32em"
                className="fill-(--text-color-default) text-xs tabular-nums"
              >
                {text}
              </text>
            ))}
          </svg>
          <Crosshair scale={scale} series={series} colorOf={colorOf} />
        </>
      ) : null}
    </div>
  );
};
