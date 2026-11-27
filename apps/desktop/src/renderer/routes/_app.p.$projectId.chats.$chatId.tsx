import { ChatNotFound } from "@starlight/client";
import { createFileRoute, type ErrorComponentProps, Navigate } from "@tanstack/react-router";
import { ChatView } from "#renderer/features/agent/chat-view.tsx";
import { PageError } from "#renderer/features/shell/page-error.tsx";

export const Route = createFileRoute("/_app/p/$projectId/chats/$chatId")({
  loader: ({ context: { queryClient, queries }, params }) =>
    queryClient.ensureQueryData(queries.chat(params.chatId)),
  component: () => <ChatView chatId={Route.useParams().chatId} />,
  errorComponent: ChatError,
});

function ChatError({ error }: ErrorComponentProps) {
  const { projectId } = Route.useParams();
  return error instanceof ChatNotFound ? (
    <Navigate to="/p/$projectId/chats" params={{ projectId }} replace />
  ) : (
    <PageError error={error} />
  );
}
