import { Interface } from "@starlight/ui";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { CommandPalette } from "#renderer/features/command-palette/command-palette.tsx";
import { useMouseHistory } from "#renderer/features/history/use-mouse-history.ts";
import {
  colorScheme,
  cursor,
  useChatAppearance,
  useInterfaceZoom,
  useNativeColorScheme,
} from "#renderer/features/settings/appearance.ts";
import { useHiddenFilesToggle } from "#renderer/features/settings/files.ts";
import { type RouterContext, useStarlight } from "#renderer/lib/context.ts";
import { useStore } from "#renderer/lib/store.ts";
import { useWindowReady } from "#renderer/lib/use-window-ready.ts";

const Root = () => {
  const { subscriptions } = useStarlight();
  useEffect(() => subscriptions.agentUsage(), [subscriptions]);
  useInterfaceZoom();
  useNativeColorScheme();
  useChatAppearance();
  useWindowReady();
  useMouseHistory();
  useHiddenFilesToggle();
  return (
    <Interface.Root colorScheme={useStore(colorScheme)} pointerCursors={useStore(cursor) === "pointer"}>
      <Outlet />
      <CommandPalette />
    </Interface.Root>
  );
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Root,
});
