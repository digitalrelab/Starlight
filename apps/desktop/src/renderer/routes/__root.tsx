import { Interface } from "@starlight/ui";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import {
  colorScheme,
  cursor,
  useChatAppearance,
  useInterfaceZoom,
  useNativeColorScheme,
} from "#renderer/features/settings/appearance.ts";
import type { RouterContext } from "#renderer/lib/context.ts";
import { useStored } from "#renderer/lib/storage.ts";
import { useHistoryButtons } from "#renderer/lib/use-history-buttons.ts";
import { useWindowReady } from "#renderer/lib/use-window-ready.ts";

const Root = () => {
  useInterfaceZoom();
  useNativeColorScheme();
  useChatAppearance();
  useWindowReady();
  useHistoryButtons();
  return (
    <Interface.Root colorScheme={useStored(colorScheme)} pointerCursors={useStored(cursor) === "pointer"}>
      <Outlet />
    </Interface.Root>
  );
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Root,
});
