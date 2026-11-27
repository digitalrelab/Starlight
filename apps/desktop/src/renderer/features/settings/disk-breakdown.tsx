import type { DiskUsage } from "@starlight/client";
import { Button, cn, Item, Tooltip } from "@starlight/ui";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useStarlight } from "../../lib/context.ts";
import { formatSize } from "../../lib/format.ts";

interface Part {
  readonly key: keyof DiskUsage;
  readonly label: string;
  readonly description: string;
  readonly fill: string;
}

const PARTS: ReadonlyArray<Part> = [
  {
    key: "previews",
    label: "Previews",
    description: "Made from your files, safe to clear",
    fill: "bg-series-1",
  },
  { key: "library", label: "Library", description: "Your workspaces and settings", fill: "bg-series-2" },
  { key: "other", label: "Other", description: "Caches and app data", fill: "bg-series-other" },
];

const shareFormat = new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1 });

const describe = (part: Part, bytes: number, total: number) =>
  `${part.label} · ${formatSize(bytes)} · ${shareFormat.format(total > 0 ? bytes / total : 0)}`;

interface UsageBarProps {
  readonly usage: DiskUsage;
  readonly total: number;
  readonly active: keyof DiskUsage | null;
  readonly onActive: (key: keyof DiskUsage | null) => void;
}

const UsageBar = ({ usage, total, active, onActive }: UsageBarProps) => (
  <div
    role="img"
    aria-label={PARTS.map((part) => describe(part, usage[part.key], total)).join(", ")}
    className="flex gap-0.5"
    onMouseLeave={() => onActive(null)}
  >
    {PARTS.filter((part) => usage[part.key] > 0).map((part) => (
      <Tooltip key={part.key} label={describe(part, usage[part.key], total)}>
        <div
          className="group/segment min-w-1 py-1.5 transition-[flex-grow] duration-300"
          style={{ flexGrow: usage[part.key] }}
          onMouseEnter={() => onActive(part.key)}
        >
          <div
            className={cn(
              "h-2 transition-opacity group-first/segment:rounded-l-full group-last/segment:rounded-r-full",
              part.fill,
              active && active !== part.key && "opacity-30",
            )}
          />
        </div>
      </Tooltip>
    ))}
  </div>
);

const ClearPreviews = ({ bytes }: { readonly bytes: number }) => {
  const { mutations } = useStarlight();
  const clear = useMutation(mutations.clearPreviews());
  return (
    <Button intent="secondary" disabled={clear.isPending || bytes === 0} onClick={() => clear.mutate()}>
      Clear
    </Button>
  );
};

export const DiskBreakdown = ({ usage }: { readonly usage: DiskUsage }) => {
  const [active, setActive] = useState<keyof DiskUsage | null>(null);
  const total = PARTS.reduce((sum, part) => sum + usage[part.key], 0);
  return (
    <Item.List>
      <div className="flex flex-col gap-1.5 py-4">
        <div className="flex justify-between text-subtle">
          <span>Used by Starlight</span>
          <span className="tabular-nums">{formatSize(total)}</span>
        </div>
        <UsageBar usage={usage} total={total} active={active} onActive={setActive} />
      </div>
      {PARTS.map((part) => (
        <Item.Root
          key={part.key}
          onMouseEnter={() => setActive(part.key)}
          onMouseLeave={() => setActive(null)}
        >
          <Item.Main className="items-start">
            <Item.Media className="h-5">
              <span className={cn("size-2.5 rounded-full", part.fill)} />
            </Item.Media>
            <Item.Content>
              <Item.Title>{part.label}</Item.Title>
              <Item.Description>{part.description}</Item.Description>
            </Item.Content>
          </Item.Main>
          <span className="text-subtle tabular-nums">{formatSize(usage[part.key])}</span>
          {part.key === "previews" && <ClearPreviews bytes={usage.previews} />}
        </Item.Root>
      ))}
    </Item.List>
  );
};
