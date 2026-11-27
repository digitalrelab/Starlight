import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AgentShell } from "#renderer/features/agent/agent-shell.tsx";
import { ChatError, ChatView } from "#renderer/features/agent/chat-view.tsx";
import { usePrepareAgentProviders } from "#renderer/features/agent/use-prepare-agent-providers.ts";
import { MainShell } from "#renderer/features/shell/main-shell.tsx";
import { useStarlight } from "#renderer/lib/context.ts";

export const Route = createFileRoute("/chats/$chatId")({
  loader: async ({ context: { queryClient, queries }, params }) => {
    const { chat } = await queryClient.ensureQueryData(queries.chat(params.chatId));
    await Promise.all([
      queryClient.ensureQueryData(queries.projects()),
      queryClient.ensureQueryData(queries.chats(chat.projectId)),
      queryClient.ensureQueryData(queries.agentProviders()),
    ]);
  },
  component: Chat,
  errorComponent: ({ error }) => (
    <AgentShell>
      <ChatError error={error} />
    </AgentShell>
  ),
});

function Chat() {
  const { chatId } = Route.useParams();
  const { queries } = useStarlight();
  const { projectId } = useSuspenseQuery(queries.chat(chatId)).data.chat;
  usePrepareAgentProviders();
  const view = <ChatView key={chatId} chatId={chatId} />;
  return projectId === null ? (
    <AgentShell>{view}</AgentShell>
  ) : (
    <MainShell activeProjectId={projectId}>{view}</MainShell>
  );
}
