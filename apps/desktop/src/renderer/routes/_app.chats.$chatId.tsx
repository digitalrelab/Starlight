import { createFileRoute } from "@tanstack/react-router";
import { ChatError, ChatView } from "#renderer/features/agent/chat-view.tsx";
import { usePrepareAgentProviders } from "#renderer/features/agent/use-prepare-agent-providers.ts";

export const Route = createFileRoute("/_app/chats/$chatId")({
  loader: async ({ context: { queryClient, queries }, params }) => {
    const { chat } = await queryClient.ensureQueryData(queries.chat(params.chatId));
    await Promise.all([
      queryClient.ensureQueryData(queries.chats(chat.projectId)),
      queryClient.ensureQueryData(queries.agentProviders()),
    ]);
  },
  component: Chat,
  errorComponent: ({ error }) => <ChatError error={error} />,
});

function Chat() {
  const { chatId } = Route.useParams();
  usePrepareAgentProviders();
  return <ChatView key={chatId} chatId={chatId} />;
}
