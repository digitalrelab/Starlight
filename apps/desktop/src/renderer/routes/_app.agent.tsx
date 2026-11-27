import { createFileRoute } from "@tanstack/react-router";
import { NewChat } from "#renderer/features/agent/new-chat.tsx";
import { usePrepareAgentProviders } from "#renderer/features/agent/use-prepare-agent-providers.ts";

export const Route = createFileRoute("/_app/agent")({
  loader: ({ context: { queryClient, queries } }) =>
    Promise.all([
      queryClient.ensureQueryData(queries.chats(null)),
      queryClient.ensureQueryData(queries.agentProviders()),
    ]),
  component: Agent,
});

function Agent() {
  usePrepareAgentProviders();
  return <NewChat projectId={null} />;
}
