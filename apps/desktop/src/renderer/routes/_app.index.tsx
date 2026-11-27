import { FolderOpenIcon } from "@hugeicons-pro/core-stroke-rounded";
import { Button, Icon } from "@starlight/ui";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "#renderer/features/shell/page-header.tsx";
import { useOpenWorkspace } from "#renderer/features/workspaces/use-open-workspace.ts";

export const Route = createFileRoute("/_app/")({
  component: Home,
});

function Home() {
  const openWorkspace = useOpenWorkspace();

  return (
    <>
      <PageHeader />
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-subtle">Open a folder to start.</p>
        <Button onClick={openWorkspace.run} disabled={openWorkspace.pending}>
          <Icon icon={FolderOpenIcon} />
          Open Folder…
        </Button>
        {openWorkspace.error ? <p className="text-sm text-danger">{openWorkspace.error.message}</p> : null}
      </div>
    </>
  );
}
