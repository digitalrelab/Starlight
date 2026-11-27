import { RefreshDotIcon } from "@hugeicons-pro/core-stroke-rounded";
import type { Update } from "@starlight/client";
import {
  Button,
  cn,
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  Prose,
} from "@starlight/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useStarlight } from "../../lib/context.ts";

const LABELS = {
  available: "Update available",
  downloading: "Downloading update",
  downloaded: "Restart to update",
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
        <div className="flex h-control items-center gap-3">
          <Progress value={update.progress} label={LABELS.downloading} />
          <span className="text-sm text-subtle tabular-nums">{Math.round(update.progress * 100)}%</span>
        </div>
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
      <IconButton
        icon={RefreshDotIcon}
        label={LABELS[update.status]}
        className={cn("text-brand hover:text-brand data-[popup-open]:text-brand", className)}
        render={<PopoverTrigger />}
      />
      <PopoverContent
        side="top"
        align="end"
        aria-label={`Starlight ${update.version}`}
        className="flex w-80 flex-col gap-3"
      >
        <Prose html={update.releaseNotes} />
        <UpdateAction update={update} />
      </PopoverContent>
    </Popover>
  );
};
