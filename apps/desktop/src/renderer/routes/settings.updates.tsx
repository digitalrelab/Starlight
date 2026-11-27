import { RefreshDotIcon } from "@hugeicons-pro/core-stroke-rounded";
import type { UpdaterState } from "@starlight/client";
import { Button, cn, Icon, Item, Prose, StatusPill, type StatusTone } from "@starlight/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "../features/settings/settings-page.tsx";
import { UpdateAction } from "../features/updates/update-action.tsx";
import { useStarlight } from "../lib/context.ts";

export const Route = createFileRoute("/settings/updates")({
  component: Updates,
});

const status = ({ enabled, checking, checkFailed, update }: UpdaterState): [StatusTone, string] => {
  if (!enabled) return ["neutral", "Development build"];
  if (update?.failure === "download") return ["danger", "Download failed"];
  if (update?.failure === "install") return ["danger", "Install failed"];
  if (update?.status === "available") return ["brand", `${update.version} available`];
  if (update?.status === "downloading") return ["brand", `Downloading ${update.version}`];
  if (update?.status === "downloaded") return ["brand", "Ready to restart"];
  if (checking) return ["neutral", "Checking…"];
  if (checkFailed) return ["danger", "Couldn't check"];
  return ["success", "Up to date"];
};

function Updates() {
  const { queries, mutations } = useStarlight();
  const { data: updater } = useQuery(queries.updater());
  const check = useMutation(mutations.checkForUpdates());
  if (!updater) return null;

  const [tone, label] = status(updater);

  return (
    <SettingsPage title="Updates">
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
    </SettingsPage>
  );
}
