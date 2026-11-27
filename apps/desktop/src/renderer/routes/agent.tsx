import { createFileRoute } from "@tanstack/react-router";
import { AgentShell } from "#renderer/features/agent/agent-shell.tsx";
import { NewChat } from "#renderer/features/agent/new-chat.tsx";
import { usePrepareAgentProviders } from "#renderer/features/agent/use-prepare-agent-providers.ts";

export const Route = createFileRoute("/agent")({
  loader: ({ context: { queryClient, queries } }) =>
    Promise.all([
      queryClient.ensureQueryData(queries.chats(null)),
      queryClient.ensureQueryData(queries.agentProviders()),
    ]),
  component: Agent,
});

function Agent() {
  usePrepareAgentProviders();
  return (
    <AgentShell>
      <NewChat projectId={null} />
    </AgentShell>
  );
}
