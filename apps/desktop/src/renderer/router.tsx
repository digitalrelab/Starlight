import { createClient, createQueryOptions } from "@starlight/client";
import { QueryClient } from "@tanstack/react-query";
import { createHashHistory, createRouter, Navigate } from "@tanstack/react-router";
import { portSources } from "./lib/ports.ts";
import { rememberLocation } from "./features/projects/project-memory.ts";
import { anyString, defineStored } from "./lib/storage.ts";
import { routeTree } from "./routeTree.gen.ts";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: false } },
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

const resolvedProject = () => {
  const params: { readonly projectId?: string; readonly chatId?: string } =
    router.state.matches.at(-1)?.params ?? {};
  const { projectId, chatId } = params;
  if (projectId !== undefined) return projectId;
  if (chatId === undefined) return null;
  return queryClient.getQueryData(context.queries.chat(chatId).queryKey)?.chat.projectId ?? null;
};

router.subscribe("onResolved", ({ toLocation }) => {
  lastLocation.set(toLocation.href);
  const projectId = resolvedProject();
  if (projectId !== null) rememberLocation(projectId, toLocation.href);
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
  interface HistoryState {
    readonly fromDirectory?: boolean;
  }
}
