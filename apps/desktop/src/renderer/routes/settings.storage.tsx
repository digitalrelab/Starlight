import { Button, Item } from "@starlight/ui";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "../features/settings/settings-page.tsx";
import { useStarlight } from "../lib/context.ts";
import { formatSize } from "../lib/format.ts";

export const Route = createFileRoute("/settings/storage")({
  loader: ({ context: { queryClient, queries } }) => queryClient.ensureQueryData(queries.storageUsage()),
  component: Storage,
});

const Size = ({ bytes }: { readonly bytes: number }) => (
  <span className="text-subtle tabular-nums">{formatSize(bytes)}</span>
);

function Storage() {
  const { queries, mutations } = useStarlight();
  const { data: usage } = useSuspenseQuery(queries.storageUsage());
  const clear = useMutation(mutations.clearThumbnails());
  const { thumbnails } = usage;

  return (
    <SettingsPage title="Storage">
      <p className="text-subtle">Starlight is using {formatSize(usage.totalBytes)} on this Mac</p>
      <Item.List>
        <Item.Root>
          <Item.Content>
            <Item.Title>Thumbnails</Item.Title>
            <Item.Description>
              Photo previews, kept under {formatSize(thumbnails.limitBytes)} and rebuilt as you browse
            </Item.Description>
          </Item.Content>
          <Size bytes={thumbnails.bytes} />
          <Button
            intent="secondary"
            disabled={clear.isPending || thumbnails.bytes === 0}
            onClick={() => clear.mutate()}
          >
            Clear
          </Button>
        </Item.Root>
        <Item.Root>
          <Item.Content>
            <Item.Title>App data</Item.Title>
            <Item.Description>Workspaces, preferences and system caches</Item.Description>
          </Item.Content>
          <Size bytes={usage.totalBytes - thumbnails.bytes} />
        </Item.Root>
      </Item.List>
    </SettingsPage>
  );
}
