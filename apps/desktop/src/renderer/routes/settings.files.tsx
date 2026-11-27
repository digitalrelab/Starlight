import { Item, Switch } from "@starlight/ui";
import { createFileRoute } from "@tanstack/react-router";
import { hiddenFiles } from "#renderer/features/settings/files.ts";
import { IgnorePatterns } from "#renderer/features/settings/ignore-patterns.tsx";
import { SettingsPage } from "#renderer/features/settings/settings-page.tsx";
import { useStore } from "#renderer/lib/store.ts";

export const Route = createFileRoute("/settings/files")({
  loader: ({ context: { queryClient, queries } }) => queryClient.ensureQueryData(queries.ignorePatterns()),
  component: Files,
});

function Files() {
  return (
    <SettingsPage title="Files">
      <Item.List>
        <Item.Root>
          <Item.Content>
            <Item.Title htmlFor="hidden-files">Show hidden files</Item.Title>
            <Item.Description>Include files and folders your system normally hides</Item.Description>
          </Item.Content>
          <Switch
            id="hidden-files"
            checked={useStore(hiddenFiles) === "show"}
            onCheckedChange={(checked) => hiddenFiles.set(checked ? "show" : "hide")}
          />
        </Item.Root>
      </Item.List>
      <IgnorePatterns />
    </SettingsPage>
  );
}
