import { RefreshDotIcon } from "@hugeicons-pro/core-stroke-rounded";
import type { Update } from "@starlight/client";
import { Markdown } from "@starlight/markdown";
import {
  Button,
  cn,
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ProgressRing,
  ScrollArea,
} from "@starlight/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useStarlight } from "../../lib/context.ts";

const LABELS = {
  available: "Update available",
  downloading: "Downloading update",
  downloaded: "Restart to update",
} as const;

const FAILURES = {
  download: "Couldn't download the update.",
  install: "Couldn't install the update.",
} as const;

const UpdateAction = ({ update }: { readonly update: Update }) => {
  const { mutations } = useStarlight();
  const download = useMutation(mutations.downloadUpdate());
  const install = useMutation(mutations.installUpdate());

  switch (update.status) {
    case "available":
      return (
        <Button onClick={() => download.mutate()} disabled={download.isPending}>
          {update.failure ? "Try again" : "Download update"}
        </Button>
      );
    case "downloading":
      return (
        <p className="flex h-control items-center px-2.5 text-subtle tabular-nums">
          Downloading… {Math.round(update.progress * 100)}%
        </p>
      );
    case "downloaded":
      return (
        <Button onClick={() => install.mutate()} disabled={install.isPending}>
          {update.failure ? "Try again" : "Restart to update"}
        </Button>
      );
  }
};

export const UpdateButton = ({ className }: { readonly className?: string }) => {
  const { queries } = useStarlight();
  const { data: update } = useQuery(queries.update());
  if (!update) return null;

  return (
    <Popover>
      <span className={cn("relative inline-flex", className)}>
        <IconButton
          icon={RefreshDotIcon}
          label={update.failure ? FAILURES[update.failure] : LABELS[update.status]}
          className={
            update.failure ? "text-danger highlighted:text-danger" : "text-brand highlighted:text-brand"
          }
          render={<PopoverTrigger />}
        />
        {update.status === "downloading" ? (
          <ProgressRing
            value={update.progress}
            label={LABELS.downloading}
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
          <Markdown value={update.releaseNotes} />
        </ScrollArea>
        <div className="flex items-center justify-end gap-3">
          {update.failure ? <p className="mr-auto text-sm text-danger">{FAILURES[update.failure]}</p> : null}
          <UpdateAction update={update} />
        </div>
      </PopoverContent>
    </Popover>
  );
};
