import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "#renderer/features/settings/settings-page.tsx";
import { WorkspaceSettings } from "#renderer/features/workspaces/workspace-settings.tsx";
import { useStarlight } from "#renderer/lib/context.ts";

export const Route = createFileRoute("/_app/w/$workspaceId/settings")({
  component: Settings,
});

function Settings() {
  const { workspaceId } = Route.useParams();
  const { queries } = useStarlight();
  const { data: workspace } = useSuspenseQuery(queries.workspace(workspaceId));
  return (
    <SettingsPage title="Workspace Settings">
      <WorkspaceSettings workspace={workspace} />
    </SettingsPage>
  );
}
