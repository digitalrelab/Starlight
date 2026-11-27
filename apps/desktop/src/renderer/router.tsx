import { createClient, createQueryOptions } from "@starlight/client";
import { QueryClient } from "@tanstack/react-query";
import { createHashHistory, createRouter } from "@tanstack/react-router";
import { portSources } from "./lib/ports.ts";
import { anyString, defineStored } from "./lib/storage.ts";
import { routeTree } from "./routeTree.gen.ts";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: false } },
});

const client = createClient(portSources);

const lastLocation = defineStored("last-location", anyString, "/");
if (!window.location.hash) history.replaceState(null, "", `#${lastLocation.get()}`);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
  context: {
    ...createQueryOptions(client, queryClient),
    queryClient,
  },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
});

router.subscribe("onResolved", ({ toLocation }) => lastLocation.set(toLocation.href));

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
