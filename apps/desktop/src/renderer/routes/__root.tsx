import { Interface } from "@starlight/ui";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { useMouseHistory } from "#renderer/features/history/use-mouse-history.ts";
import {
  colorScheme,
  cursor,
  useChatAppearance,
  useInterfaceZoom,
} from "#renderer/features/settings/appearance.ts";
import { useHiddenFilesToggle } from "#renderer/features/settings/files.ts";
import type { RouterContext } from "#renderer/lib/context.ts";
import { useStored } from "#renderer/lib/storage.ts";
import { useWindowReady } from "#renderer/lib/use-window-ready.ts";

const Root = () => {
  useInterfaceZoom();
  useChatAppearance();
  useWindowReady();
  useMouseHistory();
  useHiddenFilesToggle();
  return (
    <Interface.Root colorScheme={useStored(colorScheme)} pointerCursors={useStored(cursor) === "pointer"}>
      <Outlet />
    </Interface.Root>
  );
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Root,
});
