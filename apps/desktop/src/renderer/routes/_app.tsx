import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "../features/shell/app-shell.tsx";
import { MainSidebar } from "../features/shell/main-sidebar.tsx";

export const Route = createFileRoute("/_app")({
  component: () => (
    <AppShell sidebar={<MainSidebar />}>
      <Outlet />
    </AppShell>
  ),
});
