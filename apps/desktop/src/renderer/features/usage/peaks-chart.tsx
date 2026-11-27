import { cn } from "@starlight/ui";
import { useRef, useState } from "react";
import { formatDay } from "#renderer/lib/format.ts";
import { useElementWidth } from "#renderer/lib/use-element-width.ts";
import { ChartTooltip, type Inset, PercentGrid, percentScale, TooltipRow } from "./chart.tsx";
import { FULL_PERCENT } from "./pace.ts";

const HEIGHT = 136;
const INSET: Inset = { top: 14, right: 8, bottom: 24, left: 40 };
const BAR_WIDTH = 12;
const BAR_GAP = 2;
const RADIUS = 4;
const LIMIT_MARK_OFFSET = 7;

export interface PeakColumn {
  readonly start: number;
  readonly peaks: ReadonlyMap<string, number>;
  readonly current: boolean;
}

interface Props {
  readonly columns: ReadonlyArray<PeakColumn>;
  readonly labels: ReadonlyArray<string>;
  readonly colorOf: (label: string) => string;
}

const barPath = (x: number, top: number, bottom: number) => {
  const r = Math.min(RADIUS, bottom - top, BAR_WIDTH / 2);
  const right = x + BAR_WIDTH;
  return `M${x} ${bottom}V${top + r}Q${x} ${top} ${x + r} ${top}H${right - r}Q${right} ${top} ${right} ${top + r}V${bottom}Z`;
};

const Hover = ({
  columns,
  labels,
  colorOf,
  band,
  width,
}: Props & { readonly band: number; readonly width: number }) => {
  const [index, setIndex] = useState<number | null>(null);
  const column = index === null ? undefined : columns[index];
  return (
    <div
      className="absolute inset-0 flex"
      style={{ paddingLeft: INSET.left, paddingRight: INSET.right, paddingBottom: INSET.bottom }}
      onPointerLeave={() => setIndex(null)}
    >
      {columns.map(({ start }, position) => (
        <div
          key={start}
          className={cn("flex-1 rounded-md", position === index && "bg-neutral-subtle-hovered")}
          onPointerEnter={() => setIndex(position)}
        />
      ))}
      {column && index !== null ? (
        <ChartTooltip
          x={INSET.left + band * (index + 0.5)}
          width={width}
          title={column.current ? "This week so far" : `Week of ${formatDay(column.start)}`}
        >
          {labels.map((label) => (
            <TooltipRow
              key={label}
              color={colorOf(label)}
              label={label}
              value={`${Math.round(column.peaks.get(label) ?? 0)}%`}
            />
          ))}
        </ChartTooltip>
      ) : null}
    </div>
  );
};

export const PeaksChart = ({ columns, labels, colorOf }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const width = useElementWidth(ref);
  const scale = percentScale(width, HEIGHT, INSET);
  const band = (width - INSET.left - INSET.right) / Math.max(columns.length, 1);
  const group = labels.length * BAR_WIDTH + (labels.length - 1) * BAR_GAP;

  return (
    <div ref={ref} className="relative" style={{ height: HEIGHT }}>
      {width > 0 ? (
        <>
          <svg width={width} height={HEIGHT} className="overflow-visible">
            <PercentGrid scale={scale} />
            {columns.map(({ start, peaks, current }, index) => {
              const center = INSET.left + band * (index + 0.5);
              return (
                <g key={start} opacity={current ? 0.5 : 1}>
                  {labels.map((label, position) => {
                    const percent = Math.min(peaks.get(label) ?? 0, FULL_PERCENT);
                    const x = center - group / 2 + position * (BAR_WIDTH + BAR_GAP);
                    return percent > 0 ? (
                      <g key={label}>
                        <path d={barPath(x, scale.y(percent), scale.y(0))} fill={colorOf(label)} />
                        {percent === FULL_PERCENT ? (
                          <circle
                            cx={x + BAR_WIDTH / 2}
                            cy={scale.y(FULL_PERCENT) - LIMIT_MARK_OFFSET}
                            r={2.5}
                            className="fill-(--text-color-danger)"
                          />
                        ) : null}
                      </g>
                    ) : null;
                  })}
                  <text
                    x={center}
                    y={HEIGHT - 6}
                    textAnchor="middle"
                    className="fill-(--text-color-subtlest) text-xs"
                  >
                    {formatDay(start)}
                  </text>
                </g>
              );
            })}
          </svg>
          <Hover columns={columns} labels={labels} colorOf={colorOf} band={band} width={width} />
        </>
      ) : null}
    </div>
  );
};
