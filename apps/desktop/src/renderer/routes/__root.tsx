import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { AppearanceRoot } from "../features/settings/appearance-root.tsx";
import type { RouterContext } from "../lib/context.ts";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <AppearanceRoot>
      <Outlet />
    </AppearanceRoot>
  ),
});
