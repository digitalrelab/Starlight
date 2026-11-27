import { RefreshDotIcon } from "@hugeicons-pro/core-stroke-rounded";
import {
  cn,
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ProgressRing,
  Prose,
  ScrollArea,
} from "@starlight/ui";
import { useQuery } from "@tanstack/react-query";
import { useStarlight } from "../../lib/context.ts";
import { UpdateAction } from "./update-action.tsx";
import { updateStatus } from "./update-status.ts";

export const UpdateButton = ({ className }: { readonly className?: string }) => {
  const { queries } = useStarlight();
  const { data: updater } = useQuery(queries.updater());
  const update = updater?.update;
  if (!update) return null;

  const { tone, label } = updateStatus(updater);

  return (
    <Popover>
      <span className={cn("relative inline-flex", className)}>
        <IconButton
          icon={RefreshDotIcon}
          label={label}
          className={
            tone === "danger" ? "text-danger highlighted:text-danger" : "text-brand highlighted:text-brand"
          }
          render={<PopoverTrigger />}
        />
        {update.status === "downloading" ? (
          <ProgressRing
            value={update.progress}
            label={label}
            className="pointer-events-none absolute inset-0 size-full text-brand"
          />
        ) : null}
        {update.status === "downloaded" && !update.failure ? (
          <span className="pointer-events-none absolute top-0.5 right-0.5 size-2 rounded-full bg-brand-bold ring-2 ring-(--background-color-surface-sunken)" />
        ) : null}
      </span>
      <PopoverContent
        side="top"
        align="end"
        aria-label={`Starlight ${update.version}`}
        className="max-h-[min(28rem,var(--available-height))] w-80 gap-3"
      >
        <ScrollArea className="-mx-3" contentClassName="px-3">
          <Prose.Root>
            <Prose.Html html={update.releaseNotes} />
          </Prose.Root>
        </ScrollArea>
        <div className="flex items-center justify-end gap-3">
          {update.failure ? <p className="mr-auto text-sm text-danger">{label}</p> : null}
          <UpdateAction update={update} />
        </div>
      </PopoverContent>
    </Popover>
  );
};
