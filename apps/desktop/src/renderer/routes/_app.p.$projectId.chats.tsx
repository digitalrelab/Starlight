import { createFileRoute, Outlet } from "@tanstack/react-router";
import { usePrepareAgentProviders } from "#renderer/features/agent/use-prepare-agent-providers.ts";

export const Route = createFileRoute("/_app/p/$projectId/chats")({
  loader: ({ context: { queryClient, queries } }) => queryClient.ensureQueryData(queries.agentProviders()),
  component: ProjectChatsLayout,
});

function ProjectChatsLayout() {
  usePrepareAgentProviders();
  return <Outlet />;
}
