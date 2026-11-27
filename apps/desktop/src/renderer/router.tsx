import { createClient, createQueryOptions } from "@starlight/client";
import { focusManager, QueryClient } from "@tanstack/react-query";
import { createHashHistory, createRouter, Navigate } from "@tanstack/react-router";
import { portSources } from "./lib/ports.ts";
import { anyString, defineStored } from "./lib/storage.ts";
import { routeTree } from "./routeTree.gen.ts";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: false } },
});

const FOCUS_EVENTS = ["focus", "visibilitychange"] as const;

focusManager.setEventListener((onFocus) => {
  const listener = () => onFocus();
  for (const event of FOCUS_EVENTS) window.addEventListener(event, listener);
  return () => {
    for (const event of FOCUS_EVENTS) window.removeEventListener(event, listener);
  };
});

const client = createClient(portSources);
const context = { ...createQueryOptions(client, queryClient), queryClient };

void queryClient.prefetchQuery(context.queries.agentProviders());

const lastLocation = defineStored("last-location", anyString, "/");
if (!window.location.hash) history.replaceState(null, "", `#${lastLocation.get()}`);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
  context,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  defaultNotFoundComponent: () => <Navigate to="/" replace />,
});

router.subscribe("onResolved", ({ toLocation }) => lastLocation.set(toLocation.href));

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
  interface HistoryState {
    readonly fromDirectory?: boolean;
  }
}
