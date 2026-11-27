import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { AgentSidebar, AgentSidebarFooter } from "#renderer/features/agent/agent-sidebar.tsx";
import { AppShell } from "#renderer/features/shell/app-shell.tsx";
import { useStarlight } from "#renderer/lib/context.ts";

export const Route = createFileRoute("/agent")({
  loader: ({ context: { queryClient, queries } }) =>
    Promise.all([
      queryClient.ensureQueryData(queries.chats()),
      queryClient.ensureQueryData(queries.agentProviders()),
    ]),
  component: AgentLayout,
});

function AgentLayout() {
  const { mutations } = useStarlight();
  const { mutate: prepare } = useMutation(mutations.prepareAgentProviders());
  useEffect(() => prepare(), [prepare]);

  return (
    <AppShell sidebar={<AgentSidebar />} footer={<AgentSidebarFooter />}>
      <Outlet />
    </AppShell>
  );
}
