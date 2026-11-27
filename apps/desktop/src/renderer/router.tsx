import { createClient, createQueryOptions } from "@starlight/client";
import { QueryClient } from "@tanstack/react-query";
import { createHashHistory, createRouter } from "@tanstack/react-router";
import { portSources } from "./lib/ports.ts";
import { routeTree } from "./routeTree.gen.ts";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: false } },
});

const client = createClient(portSources);
const context = { ...createQueryOptions(client, queryClient), queryClient };

void queryClient.prefetchQuery(context.queries.agentProviders());

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
  context,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
