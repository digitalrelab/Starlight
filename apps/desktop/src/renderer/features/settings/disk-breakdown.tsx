import type { DiskUsage } from "@starlight/client";
import { Button, cn, Item, Tooltip } from "@starlight/ui";
import { useMutation } from "@tanstack/react-query";
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

const UsageBar = ({ usage, total }: { readonly usage: DiskUsage; readonly total: number }) => (
  <div
    role="img"
    aria-label={PARTS.map((part) => describe(part, usage[part.key], total)).join(", ")}
    className="flex gap-0.5"
  >
    {PARTS.filter((part) => usage[part.key] > 0).map((part) => (
      <Tooltip key={part.key} label={describe(part, usage[part.key], total)}>
        <div
          className="min-w-2 py-2 transition-[flex-grow] duration-300"
          style={{ flexGrow: usage[part.key] }}
        >
          <div className={cn("h-2 rounded-full", part.fill)} />
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
  const total = PARTS.reduce((sum, part) => sum + usage[part.key], 0);
  return (
    <>
      <section className="flex flex-col gap-1">
        <div className="flex justify-between text-subtle">
          <span>Used by Starlight</span>
          <span className="tabular-nums">{formatSize(total)}</span>
        </div>
        <UsageBar usage={usage} total={total} />
      </section>
      <Item.List>
        {PARTS.map((part) => (
          <Item.Root key={part.key}>
            <Item.Main>
              <Item.Media>
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
    </>
  );
};
