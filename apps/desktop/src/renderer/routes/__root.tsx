import { Interface } from "@starlight/ui";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { colorScheme, cursor } from "../features/settings/appearance.ts";
import type { RouterContext } from "../lib/context.ts";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <Interface.Root colorScheme={colorScheme.useValue()} pointerCursors={cursor.useValue() === "pointer"}>
      <Outlet />
    </Interface.Root>
  ),
});
