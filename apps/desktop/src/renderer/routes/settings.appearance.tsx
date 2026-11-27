import { Switch } from "@starlight/ui";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SettingRow } from "../features/settings/setting-row.tsx";
import { PageHeader } from "../features/shell/page-header.tsx";
import { useStarlight } from "../lib/context.ts";

export const Route = createFileRoute("/settings/appearance")({
  component: Appearance,
});

function Appearance() {
  const { queries, mutations } = useStarlight();
  const { data: settings } = useSuspenseQuery(queries.settings());
  const update = useMutation(mutations.updateSettings());

  return (
    <>
      <PageHeader>
        <span className="font-medium">Appearance</span>
      </PageHeader>
      <div className="overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-6 py-8">
          <div className="divide-y divide-border rounded-lg border border-border">
            <SettingRow
              label="Pointer cursors"
              description="Show a pointer cursor over interactive elements."
            >
              <Switch
                checked={settings.pointerCursors}
                onCheckedChange={(pointerCursors) => update.mutate({ pointerCursors })}
              />
            </SettingRow>
          </div>
        </div>
      </div>
    </>
  );
}
