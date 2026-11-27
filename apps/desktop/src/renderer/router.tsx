import { createClient, createMutations, createQueries } from "@starlight/client";
import { QueryClient } from "@tanstack/react-query";
import { createHashHistory, createRouter } from "@tanstack/react-router";
import { portSources } from "./lib/ports.ts";
import { routeTree } from "./routeTree.gen.ts";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: false } },
});

const client = createClient(portSources);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
  context: {
    queries: createQueries(client),
    mutations: createMutations(client, queryClient),
    queryClient,
  },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
