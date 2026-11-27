import type { UsageWindow } from "@starlight/client";
import { cn, Item, Tooltip } from "@starlight/ui";
import { formatSpan } from "#renderer/lib/format.ts";
import { FULL_PERCENT, type Pace, paceOf, type UsageTone } from "./usage-pace.ts";

const FILL: Record<UsageTone, string> = {
  neutral: "bg-neutral-bold",
  warning: "bg-warning-bold",
  danger: "bg-danger-bold",
};

const INK: Record<UsageTone, string> = { neutral: "", warning: "text-warning", danger: "text-danger" };

const Note = ({ pace }: { readonly pace: Pace }) => {
  const resets = pace.resetsIn === null ? null : formatSpan(pace.resetsIn);
  const alert =
    pace.used === FULL_PERCENT
      ? "Limit reached"
      : pace.runsOutIn === null
        ? null
        : `Runs out in ~${formatSpan(pace.runsOutIn, 1)}`;
  if (alert === null) return resets === null ? null : `Resets in ${resets}`;
  return (
    <>
      <span className={INK[pace.tone]}>{alert}</span>
      {resets === null ? null : ` · resets in ${resets}`}
    </>
  );
};

const Meter = ({ label, pace }: { readonly label: string; readonly pace: Pace }) => {
  const meter = (
    <div className="py-2">
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={FULL_PERCENT}
        aria-valuenow={pace.used}
        className="relative h-1.5 w-36 rounded-full bg-neutral"
      >
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-[width] duration-300",
            FILL[pace.tone],
          )}
          style={{ width: `${pace.used}%` }}
        />
        {pace.even === null ? null : (
          <div
            className="absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--text-color-default) ring-2 ring-(--background-color-surface-raised)"
            style={{ left: `${pace.even}%` }}
          />
        )}
      </div>
    </div>
  );
  return pace.even === null ? (
    meter
  ) : (
    <Tooltip label={`Even pace would be ${Math.round(pace.even)}% by now`}>{meter}</Tooltip>
  );
};

export const UsageWindowRow = ({ window, now }: { readonly window: UsageWindow; readonly now: number }) => {
  const pace = paceOf(window, now);
  const { used } = pace;
  const idle = used === 0;

  return (
    <Item.Root>
      <Item.Content>
        <Item.Title className={cn(idle && "text-subtlest")}>{window.label}</Item.Title>
        <Item.Description className="truncate">
          <Note pace={pace} />
        </Item.Description>
      </Item.Content>
      <div className="flex shrink-0 items-center gap-4">
        <Meter label={window.label} pace={pace} />
        <span
          className={cn(
            "w-10 text-right font-medium tabular-nums",
            INK[pace.tone],
            idle && "font-normal text-subtlest",
          )}
        >
          {Math.round(used)}%
        </span>
      </div>
    </Item.Root>
  );
};
