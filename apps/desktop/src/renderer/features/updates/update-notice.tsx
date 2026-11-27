import { CircleArrowUp01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { Button, Icon, NavItem, Popover, PopoverContent, PopoverTrigger, Prose } from "@starlight/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useStarlight } from "../../lib/context.ts";

export const UpdateNotice = () => {
  const { queries, mutations } = useStarlight();
  const { data: update } = useQuery(queries.update());
  const install = useMutation(mutations.installUpdate());
  if (!update) return null;

  return (
    <Popover>
      <PopoverTrigger render={<NavItem className="text-accent hover:text-accent" />}>
        <Icon icon={CircleArrowUp01Icon} className="shrink-0" />
        Update available
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        aria-label={`Starlight ${update.version}`}
        className="flex w-80 flex-col gap-3"
      >
        <Prose html={update.releaseNotes} />
        <Button
          variant="primary"
          className="self-end"
          onClick={() => install.mutate()}
          disabled={install.isPending}
        >
          Restart to update
        </Button>
      </PopoverContent>
    </Popover>
  );
};
