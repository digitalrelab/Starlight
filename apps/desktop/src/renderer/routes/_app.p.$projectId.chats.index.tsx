import { createFileRoute } from "@tanstack/react-router";
import { NewChat } from "#renderer/features/agent/new-chat.tsx";

export const Route = createFileRoute("/_app/p/$projectId/chats/")({
  component: () => <NewChat projectId={Route.useParams().projectId} />,
});
