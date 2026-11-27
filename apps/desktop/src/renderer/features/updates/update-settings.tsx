import { RefreshDotIcon } from "@hugeicons-pro/core-stroke-rounded";
import { Button, cn, Icon, Item, Prose, StatusPill } from "@starlight/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useStarlight } from "../../lib/context.ts";
import { UpdateAction } from "./update-action.tsx";
import { updateStatus } from "./update-status.ts";

export const UpdateSettings = () => {
  const { queries, mutations } = useStarlight();
  const { data: updater } = useQuery(queries.updater());
  const check = useMutation(mutations.checkForUpdates());
  if (!updater) return null;

  const { tone, label } = updateStatus(updater);

  return (
    <>
      <Item.List>
        <Item.Root className="min-h-20">
          <Item.Content className="gap-1.5">
            <Item.Title className="text-lg font-medium">Starlight</Item.Title>
            <div className="flex items-center gap-2">
              <span className="text-sm text-subtle tabular-nums">{updater.version}</span>
              <StatusPill tone={tone} pulse={updater.checking}>
                {label}
              </StatusPill>
            </div>
          </Item.Content>
          {updater.update ? (
            <UpdateAction update={updater.update} />
          ) : (
            <Button onClick={() => check.mutate()} disabled={!updater.enabled || updater.checking}>
              <Icon icon={RefreshDotIcon} className={cn(updater.checking && "animate-spin")} />
              Check for updates
            </Button>
          )}
        </Item.Root>
      </Item.List>
      {updater.update?.releaseNotes ? (
        <Item.List className="py-4">
          <Prose html={updater.update.releaseNotes} />
        </Item.List>
      ) : null}
    </>
  );
};
