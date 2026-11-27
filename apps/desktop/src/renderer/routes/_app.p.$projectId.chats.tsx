import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useAgentWarmup } from "#renderer/features/agent/use-agent-warmup.ts";

export const Route = createFileRoute("/_app/p/$projectId/chats")({
  loader: ({ context: { queryClient, queries } }) => queryClient.ensureQueryData(queries.agentProviders()),
  component: ProjectChatsLayout,
});

function ProjectChatsLayout() {
  useAgentWarmup();
  return <Outlet />;
}
