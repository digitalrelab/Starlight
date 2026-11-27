import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { useAppearance } from "../features/settings/use-appearance.ts";
import type { RouterContext } from "../lib/context.ts";

export const Route = createRootRouteWithContext<RouterContext>()({
  loader: ({ context: { queryClient, queries } }) =>
    Promise.all([
      queryClient.ensureQueryData(queries.settings()),
      queryClient.ensureQueryData(queries.recentWorkspaces()),
    ]),
  component: Root,
});

function Root() {
  useAppearance();
  return <Outlet />;
}
