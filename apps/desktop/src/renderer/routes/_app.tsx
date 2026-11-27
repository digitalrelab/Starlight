import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useMatchRoute, useParams } from "@tanstack/react-router";
import { AgentShell } from "#renderer/features/agent/agent-shell.tsx";
import { MainShell } from "#renderer/features/shell/main-shell.tsx";
import { useStarlight } from "#renderer/lib/context.ts";

export const Route = createFileRoute("/_app")({
  loader: ({ context: { queryClient, queries } }) => queryClient.ensureQueryData(queries.projects()),
  component: AppLayout,
});

function AppLayout() {
  const { queries } = useStarlight();
  const { projectId, chatId } = useParams({ strict: false });
  const onAgent = useMatchRoute()({ to: "/agent" }) !== false;
  const { data: chatProjectId } = useQuery({
    ...queries.chat(chatId ?? ""),
    enabled: chatId !== undefined,
    select: ({ chat }) => chat.projectId,
  });

  return onAgent || chatProjectId === null ? (
    <AgentShell>
      <Outlet />
    </AgentShell>
  ) : (
    <MainShell activeProjectId={projectId ?? chatProjectId ?? null}>
      <Outlet />
    </MainShell>
  );
}
