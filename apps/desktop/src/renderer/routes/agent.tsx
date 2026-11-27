import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AgentSidebar, AgentSidebarFooter } from "#renderer/features/agent/agent-sidebar.tsx";
import { usePrepareAgentProviders } from "#renderer/features/agent/use-prepare-agent-providers.ts";
import { AppShell } from "#renderer/features/shell/app-shell.tsx";

export const Route = createFileRoute("/agent")({
  loader: ({ context: { queryClient, queries } }) =>
    Promise.all([
      queryClient.ensureQueryData(queries.chats(null)),
      queryClient.ensureQueryData(queries.agentProviders()),
    ]),
  component: AgentLayout,
});

function AgentLayout() {
  usePrepareAgentProviders();
  return (
    <AppShell sidebar={<AgentSidebar />} footer={<AgentSidebarFooter />}>
      <Outlet />
    </AppShell>
  );
}
