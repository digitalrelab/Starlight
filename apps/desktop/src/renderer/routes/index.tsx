import { createFileRoute } from "@tanstack/react-router";
import { TitleBar } from "../features/layout/title-bar.tsx";
import { OpenWorkspaceButton } from "../features/workspaces/open-workspace-button.tsx";
import { RecentWorkspaces } from "../features/workspaces/recent-workspaces.tsx";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(context.queries.recentWorkspaces()),
  component: Home,
});

function Home() {
  return (
    <>
      <TitleBar />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-8 px-6 pb-16">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Starlight</h1>
          <p className="text-muted">Open a folder to start.</p>
        </div>
        <OpenWorkspaceButton />
        <RecentWorkspaces />
      </main>
    </>
  );
}
