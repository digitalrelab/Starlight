import type { UpdaterState } from "@starlight/client";
import { Button, cn, Item } from "@starlight/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "../features/settings/settings-page.tsx";
import { FAILURES, UpdateAction } from "../features/updates/update-action.tsx";
import { useStarlight } from "../lib/context.ts";
import { formatDate } from "../lib/format.ts";

export const Route = createFileRoute("/settings/updates")({
  component: Updates,
});

const describe = ({ enabled, checking, checkedAt, checkFailed, update }: UpdaterState) => {
  if (!enabled) return "Updates are only available in released builds.";
  if (update?.failure) return FAILURES[update.failure];
  switch (update?.status) {
    case "available":
      return `Version ${update.version} is available.`;
    case "downloading":
      return `Downloading version ${update.version}…`;
    case "downloaded":
      return `Version ${update.version} is ready to install.`;
  }
  if (checking) return "Checking for updates…";
  if (checkFailed) return "Couldn't check for updates.";
  return checkedAt ? `Up to date. Last checked ${formatDate(checkedAt)}.` : "Up to date.";
};

function Updates() {
  const { queries, mutations } = useStarlight();
  const { data: updater } = useQuery(queries.updater());
  const check = useMutation(mutations.checkForUpdates());
  if (!updater) return null;

  const failed = Boolean(updater.update?.failure) || (updater.checkFailed && !updater.update);

  return (
    <SettingsPage title="Updates">
      <Item.List>
        <Item.Root>
          <Item.Content>
            <Item.Title>Starlight {updater.version}</Item.Title>
            <Item.Description className={cn(failed && "text-danger")}>{describe(updater)}</Item.Description>
          </Item.Content>
          {updater.update ? (
            <UpdateAction update={updater.update} />
          ) : (
            <Button onClick={() => check.mutate()} disabled={!updater.enabled || updater.checking}>
              Check for updates
            </Button>
          )}
        </Item.Root>
      </Item.List>
    </SettingsPage>
  );
}
