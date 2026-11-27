import type { Update } from "@starlight/client";
import { Button } from "@starlight/ui";
import { useMutation } from "@tanstack/react-query";
import { useStarlight } from "../../lib/context.ts";

export const UpdateAction = ({ update }: { readonly update: Update }) => {
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
