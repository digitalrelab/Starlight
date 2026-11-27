import { Interface } from "@starlight/ui";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { colorScheme, cursor, useInterfaceZoom } from "#renderer/features/settings/appearance.ts";
import type { RouterContext } from "#renderer/lib/context.ts";

const Root = () => {
  useInterfaceZoom();
  return (
    <Interface.Root colorScheme={colorScheme.useValue()} pointerCursors={cursor.useValue() === "pointer"}>
      <Outlet />
    </Interface.Root>
  );
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Root,
});
