import { Interface } from "@starlight/ui";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { colorScheme, cursor, interfaceSize, useInterfaceZoom } from "../features/settings/appearance.ts";
import type { RouterContext } from "../lib/context.ts";

const Root = () => {
  useInterfaceZoom(interfaceSize.useValue());
  return (
    <Interface.Root colorScheme={colorScheme.useValue()} pointerCursors={cursor.useValue() === "pointer"}>
      <Outlet />
    </Interface.Root>
  );
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Root,
});
