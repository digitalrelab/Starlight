import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SettingsSidebar, SettingsSidebarFooter } from "#renderer/features/settings/settings-sidebar.tsx";
import { AppShell } from "#renderer/features/shell/app-shell.tsx";

export const Route = createFileRoute("/settings")({
  component: () => (
    <AppShell sidebar={<SettingsSidebar />} footer={<SettingsSidebarFooter />}>
      <Outlet />
    </AppShell>
  ),
});
