import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AgentSidebar, AgentSidebarFooter } from "../features/agent/agent-sidebar.tsx";
import { AppShell } from "../features/shell/app-shell.tsx";

export const Route = createFileRoute("/agent")({
  loader: ({ context: { queryClient, queries } }) =>
    Promise.all([
      queryClient.ensureQueryData(queries.conversations()),
      queryClient.ensureQueryData(queries.agentProviders()),
    ]),
  component: () => (
    <AppShell sidebar={<AgentSidebar />} footer={<AgentSidebarFooter />}>
      <Outlet />
    </AppShell>
  ),
});
