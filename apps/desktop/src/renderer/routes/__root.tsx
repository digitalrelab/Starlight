import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { RouterContext } from "../lib/context.ts";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <div className="flex h-full flex-col">
      <Outlet />
    </div>
  ),
});
