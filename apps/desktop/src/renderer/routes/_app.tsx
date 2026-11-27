import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "#renderer/features/shell/app-shell.tsx";
import { MainSidebar, MainSidebarFooter } from "#renderer/features/shell/main-sidebar.tsx";

export const Route = createFileRoute("/_app")({
  loader: ({ context: { queryClient, queries } }) => queryClient.ensureQueryData(queries.projects()),
  component: () => (
    <AppShell sidebar={<MainSidebar />} footer={<MainSidebarFooter />}>
      <Outlet />
    </AppShell>
  ),
});
