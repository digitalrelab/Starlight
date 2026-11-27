import { FolderAddIcon } from "@hugeicons-pro/core-stroke-rounded";
import { Button, Icon } from "@starlight/ui";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader } from "#renderer/features/shell/page-header.tsx";
import { byRecentUse, projectDestination } from "#renderer/features/projects/project-memory.ts";
import { useCreateProject } from "#renderer/features/projects/use-create-project.ts";

export const Route = createFileRoute("/_app/")({
  loader: async ({ context: { queryClient, queries } }) => {
    const [project] = byRecentUse(await queryClient.ensureQueryData(queries.projects()));
    if (project) throw redirect({ ...projectDestination(project.id), replace: true });
  },
  component: Home,
});

function Home() {
  const createProject = useCreateProject();

  return (
    <>
      <PageHeader />
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-subtle">Create a project from a folder to start.</p>
        <Button onClick={createProject.run} disabled={createProject.pending}>
          <Icon icon={FolderAddIcon} />
          New Project…
        </Button>
        {createProject.error ? <p className="text-sm text-danger">{createProject.error.message}</p> : null}
      </div>
    </>
  );
}
