import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { useApplyAppearance } from "../features/settings/use-apply-appearance.ts";
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
  useApplyAppearance();
  return <Outlet />;
}
