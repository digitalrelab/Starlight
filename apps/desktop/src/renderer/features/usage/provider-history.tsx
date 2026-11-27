import type { AgentProvider, UsageHistory, UsagePeak, UsageSeries } from "@starlight/client";
import { Item } from "@starlight/ui";
import type { ReactNode } from "react";
import { formatSpan } from "#renderer/lib/format.ts";
import { Legend, seriesColor } from "./chart.tsx";
import { FULL_PERCENT } from "./pace.ts";
import { type PeakColumn, PeaksChart } from "./peaks-chart.tsx";
import { ProviderSection, UsageMessage } from "./provider-section.tsx";
import { WindowChart } from "./window-chart.tsx";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const COLUMNS = 8;

interface Window {
  readonly resetsAt: number;
  readonly durationMs: number;
  readonly series: Array<UsageSeries>;
}

const windowsOf = (series: ReadonlyArray<UsageSeries>) => {
  const windows = new Map<number, Window>();
  for (const entry of series) {
    const window = windows.get(entry.resetsAt) ?? { ...entry, series: [] };
    windows.set(entry.resetsAt, window);
    window.series.push(entry);
  }
  return [...windows.values()];
};

const peakOf = ({ points }: UsageSeries) => Math.max(0, ...points.map(({ usedPercent }) => usedPercent));

const columnsOf = (past: ReadonlyArray<UsagePeak>, current: Window | undefined) => {
  const columns = new Map<number, PeakColumn & { readonly peaks: Map<string, number> }>();
  for (const peak of past) {
    const column = columns.get(peak.resetsAt) ?? {
      start: peak.resetsAt - peak.durationMs,
      peaks: new Map(),
      current: false,
    };
    columns.set(peak.resetsAt, column);
    column.peaks.set(peak.label, peak.peakPercent);
  }
  const finished: Array<PeakColumn> = [...columns.values()].sort((a, b) => a.start - b.start);
  const ongoing: Array<PeakColumn> = current
    ? [
        {
          start: current.resetsAt - current.durationMs,
          peaks: new Map(current.series.map((series) => [series.label, peakOf(series)])),
          current: true,
        },
      ]
    : [];
  return [...finished, ...ongoing].slice(-COLUMNS);
};

const summaryOf = (columns: ReadonlyArray<PeakColumn>, unit: string) => {
  const finished = columns.filter(({ current }) => !current).map(({ peaks }) => Math.max(...peaks.values()));
  if (finished.length === 0) return null;
  const hits = finished.filter((peak) => peak >= FULL_PERCENT).length;
  const total = `${finished.length} ${unit}${finished.length === 1 ? "" : "s"}`;
  return hits > 0
    ? `Hit the limit in ${hits} of ${total}`
    : `Peaked at ${Math.round(finished.reduce((sum, peak) => sum + peak, 0) / finished.length)}% on average`;
};

const Block = ({
  title,
  aside,
  children,
}: {
  readonly title: string;
  readonly aside: string | null;
  readonly children: ReactNode;
}) => (
  <Item.Panel className="flex flex-col gap-3">
    <div className="flex items-baseline justify-between gap-4">
      <span className="font-medium">{title}</span>
      {aside ? <span className="text-sm text-subtle tabular-nums">{aside}</span> : null}
    </div>
    {children}
  </Item.Panel>
);

interface Props {
  readonly provider: AgentProvider;
  readonly history: UsageHistory | undefined;
  readonly now: number;
}

const Charts = ({ provider, history, now }: Props) => {
  if (history === undefined) return <UsageMessage pending>Loading history…</UsageMessage>;
  const current = history.current.filter((series) => series.provider === provider.id);
  const past = history.past.filter((peak) => peak.provider === provider.id);
  if (current.length === 0 && past.length === 0) {
    return <UsageMessage>No history yet. Starlight records usage while it’s open.</UsageMessage>;
  }

  const labels = [...new Set([...current, ...past].map(({ label }) => label))];
  const colorOf = (label: string) => seriesColor(labels.indexOf(label));
  const windows = windowsOf(current);
  const columns = columnsOf(past, windows[0]);
  const weekly = [...current, ...past].every(({ durationMs }) => durationMs === WEEK_MS);

  return (
    <>
      {windows.map(({ resetsAt, durationMs, series }, index) => (
        <Block
          key={resetsAt}
          title={weekly ? "This week" : "Current window"}
          aside={`Resets in ${formatSpan(Math.max(resetsAt - now, 0))}`}
        >
          {index === 0 && labels.length > 1 ? <Legend labels={labels} colorOf={colorOf} /> : null}
          <WindowChart
            resetsAt={resetsAt}
            durationMs={durationMs}
            series={series}
            colorOf={colorOf}
            now={now}
          />
        </Block>
      ))}
      {columns.length > 1 ? (
        <Block
          title={weekly ? "Past weeks" : "Past windows"}
          aside={summaryOf(columns, weekly ? "week" : "window")}
        >
          <PeaksChart columns={columns} labels={labels} colorOf={colorOf} />
        </Block>
      ) : null}
    </>
  );
};

export const ProviderHistory = (props: Props) => (
  <ProviderSection provider={props.provider}>
    <Charts {...props} />
  </ProviderSection>
);
