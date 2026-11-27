import { RefreshDotIcon } from "@hugeicons-pro/core-stroke-rounded";
import type { Update } from "@starlight/client";
import {
  Button,
  cn,
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ProgressRing,
  Prose,
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
        <Button className="self-end" onClick={() => download.mutate()} disabled={download.isPending}>
          Download update
        </Button>
      );
    case "downloading":
      return (
        <p className="flex h-control items-center self-end px-2.5 text-subtle tabular-nums">
          Downloading… {Math.round(update.progress * 100)}%
        </p>
      );
    case "downloaded":
      return (
        <Button className="self-end" onClick={() => install.mutate()} disabled={install.isPending}>
          Restart to update
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
      </span>
      <PopoverContent
        side="top"
        align="end"
        aria-label={`Starlight ${update.version}`}
        className="flex w-80 flex-col gap-3"
      >
        <Prose html={update.releaseNotes} />
        {update.failure ? <p className="text-sm text-danger">{FAILURES[update.failure]}</p> : null}
        <UpdateAction update={update} />
      </PopoverContent>
    </Popover>
  );
};
