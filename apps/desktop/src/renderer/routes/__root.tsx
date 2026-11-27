import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { AppShell } from "../features/shell/app-shell.tsx";
import type { RouterContext } from "../lib/context.ts";

export const Route = createRootRouteWithContext<RouterContext>()({
  loader: ({ context }) => context.queryClient.ensureQueryData(context.queries.recentWorkspaces()),
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
