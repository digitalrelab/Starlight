import { Item, Switch } from "@starlight/ui";
import { createFileRoute } from "@tanstack/react-router";
import { hiddenFiles } from "#renderer/features/settings/files.ts";
import { SettingsPage } from "#renderer/features/settings/settings-page.tsx";
import { useStored } from "#renderer/lib/storage.ts";

export const Route = createFileRoute("/settings/files")({
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
            checked={useStored(hiddenFiles) === "show"}
            onCheckedChange={(checked) => hiddenFiles.set(checked ? "show" : "hide")}
          />
        </Item.Root>
      </Item.List>
    </SettingsPage>
  );
}
