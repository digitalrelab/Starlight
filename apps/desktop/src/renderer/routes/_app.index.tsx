import { FolderAddIcon } from "@hugeicons-pro/core-stroke-rounded";
import { Button, Icon } from "@starlight/ui";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "#renderer/features/shell/page-header.tsx";
import { useCreateWorkspace } from "#renderer/features/workspaces/use-create-workspace.ts";

export const Route = createFileRoute("/_app/")({
  component: Home,
});

function Home() {
  const createWorkspace = useCreateWorkspace();

  return (
    <>
      <PageHeader />
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-subtle">Create a workspace from a folder to start.</p>
        <Button onClick={createWorkspace.run} disabled={createWorkspace.pending}>
          <Icon icon={FolderAddIcon} />
          New Workspace…
        </Button>
        {createWorkspace.error ? (
          <p className="text-sm text-danger">{createWorkspace.error.message}</p>
        ) : null}
      </div>
    </>
  );
}
