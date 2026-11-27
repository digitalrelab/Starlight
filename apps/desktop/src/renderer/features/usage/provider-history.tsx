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

interface WindowItem {
  readonly label: string;
  readonly resetsAt: number;
  readonly durationMs: number;
}

const byWindow = <A extends WindowItem>(items: ReadonlyArray<A>) => [
  ...Map.groupBy(items, ({ resetsAt }) => resetsAt).values(),
];

const peakOf = ({ points }: UsageSeries) => Math.max(0, ...points.map(({ usedPercent }) => usedPercent));

const columnOf = <A extends WindowItem>(
  group: ReadonlyArray<A>,
  percentOf: (item: A) => number,
  current: boolean,
): Array<PeakColumn> => {
  const [first] = group;
  return first
    ? [
        {
          start: first.resetsAt - first.durationMs,
          peaks: new Map(group.map((item) => [item.label, percentOf(item)])),
          current,
        },
      ]
    : [];
};

const columnsOf = (past: ReadonlyArray<UsagePeak>, current: ReadonlyArray<UsageSeries>) =>
  [
    ...byWindow(past).flatMap((group) => columnOf(group, ({ peakPercent }) => peakPercent, false)),
    ...columnOf(current, peakOf, true),
  ].slice(-COLUMNS);

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
  const windows = byWindow(current);
  const columns = columnsOf(past, windows[0] ?? []);
  const weekly = [...current, ...past].every(({ durationMs }) => durationMs === WEEK_MS);

  return (
    <>
      {windows.map((series, index) => {
        const [first] = series;
        return first ? (
          <Block
            key={first.resetsAt}
            title={weekly ? "This week" : "Current window"}
            aside={`Resets in ${formatSpan(Math.max(first.resetsAt - now, 0))}`}
          >
            {index === 0 && labels.length > 1 ? <Legend labels={labels} colorOf={colorOf} /> : null}
            <WindowChart
              resetsAt={first.resetsAt}
              durationMs={first.durationMs}
              series={series}
              colorOf={colorOf}
              now={now}
            />
          </Block>
        ) : null;
      })}
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
