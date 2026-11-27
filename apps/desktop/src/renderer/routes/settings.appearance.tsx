import { Switch } from "@starlight/ui";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SettingRow } from "../features/settings/setting-row.tsx";
import { SettingsPage } from "../features/settings/settings-page.tsx";
import { useStarlight } from "../lib/context.ts";

export const Route = createFileRoute("/settings/appearance")({
  component: Appearance,
});

function Appearance() {
  const { queries, mutations } = useStarlight();
  const { data: settings } = useSuspenseQuery(queries.settings());
  const update = useMutation(mutations.updateSettings());

  return (
    <SettingsPage title="Appearance">
      <SettingRow label="Pointer cursors" description="Show a pointer cursor over interactive elements.">
        <Switch
          checked={settings.pointerCursors}
          onCheckedChange={(pointerCursors) => update.mutate({ pointerCursors })}
        />
      </SettingRow>
    </SettingsPage>
  );
}
