import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "../features/settings/settings-page.tsx";
import { UpdateSettings } from "../features/updates/update-settings.tsx";

export const Route = createFileRoute("/settings/updates")({
  component: () => (
    <SettingsPage title="Updates">
      <UpdateSettings />
    </SettingsPage>
  ),
});
