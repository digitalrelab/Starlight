import { createFileRoute } from "@tanstack/react-router";
import { NewChat } from "#renderer/features/agent/new-chat.tsx";
import { usePrepareAgentProviders } from "#renderer/features/agent/use-prepare-agent-providers.ts";

export const Route = createFileRoute("/_app/p/$projectId/chats")({
  loader: ({ context: { queryClient, queries } }) => queryClient.ensureQueryData(queries.agentProviders()),
  component: ProjectNewChat,
});

function ProjectNewChat() {
  usePrepareAgentProviders();
  return <NewChat projectId={Route.useParams().projectId} />;
}
