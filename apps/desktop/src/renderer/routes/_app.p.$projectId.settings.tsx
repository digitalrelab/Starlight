import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "#renderer/features/settings/settings-page.tsx";
import { ProjectSettings } from "#renderer/features/projects/project-settings.tsx";
import { useStarlight } from "#renderer/lib/context.ts";

export const Route = createFileRoute("/_app/p/$projectId/settings")({
  component: Settings,
});

function Settings() {
  const { projectId } = Route.useParams();
  const { queries } = useStarlight();
  const { data: project } = useSuspenseQuery(queries.project(projectId));
  return (
    <SettingsPage title="Project Settings">
      <ProjectSettings project={project} />
    </SettingsPage>
  );
}
