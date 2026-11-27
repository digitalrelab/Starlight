import { createFileRoute } from "@tanstack/react-router";
import { NewChat } from "#renderer/features/agent/new-chat.tsx";

export const Route = createFileRoute("/agent/")({
  component: () => <NewChat projectId={null} />,
});
