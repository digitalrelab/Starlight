import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AgentSidebar, AgentSidebarFooter } from "#renderer/features/agent/agent-sidebar.tsx";
import { useAgentWarmup } from "#renderer/features/agent/use-agent-warmup.ts";
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
  useAgentWarmup();
  return (
    <AppShell sidebar={<AgentSidebar />} footer={<AgentSidebarFooter />}>
      <Outlet />
    </AppShell>
  );
}
