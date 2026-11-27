import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { MainShell } from "#renderer/features/shell/main-shell.tsx";

export const Route = createFileRoute("/_app")({
  loader: ({ context: { queryClient, queries } }) => queryClient.ensureQueryData(queries.projects()),
  component: AppLayout,
});

function AppLayout() {
  return (
    <MainShell activeProjectId={useParams({ strict: false }).projectId ?? null}>
      <Outlet />
    </MainShell>
  );
}
