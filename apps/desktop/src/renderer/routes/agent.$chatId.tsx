import { createFileRoute } from "@tanstack/react-router";
import { ChatError, ChatView } from "#renderer/features/agent/chat-view.tsx";

export const Route = createFileRoute("/agent/$chatId")({
  loader: ({ context: { queryClient, queries }, params }) =>
    queryClient.ensureQueryData(queries.chat(params.chatId)),
  component: () => <ChatView chatId={Route.useParams().chatId} />,
  errorComponent: ({ error }) => <ChatError error={error} projectId={null} />,
});
