import { RefreshDotIcon } from "@hugeicons-pro/core-stroke-rounded";
import { Button, cn, IconButton, Popover, PopoverContent, PopoverTrigger, Prose } from "@starlight/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useStarlight } from "../../lib/context.ts";

export const UpdateButton = ({ className }: { readonly className?: string }) => {
  const { queries, mutations } = useStarlight();
  const { data: update } = useQuery(queries.update());
  const install = useMutation(mutations.installUpdate());
  if (!update) return null;

  return (
    <Popover>
      <IconButton
        icon={RefreshDotIcon}
        label="Update available"
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
        <Button className="self-end" onClick={() => install.mutate()} disabled={install.isPending}>
          Restart to update
        </Button>
      </PopoverContent>
    </Popover>
  );
};
