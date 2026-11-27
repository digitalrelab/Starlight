import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "../features/shell/page-header.tsx";
import { OpenWorkspaceButton } from "../features/workspaces/open-workspace-button.tsx";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <>
      <PageHeader />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 pb-11">
        <p className="text-muted">Open a folder to start.</p>
        <OpenWorkspaceButton variant="primary" />
      </div>
    </>
  );
}
