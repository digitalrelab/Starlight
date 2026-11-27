import {
  experimental_streamedQuery as streamedQuery,
  mutationOptions,
  queryOptions,
  type QueryClient,
} from "@tanstack/react-query";
import type { EntryRef, Listing, Update } from "@starlight/contracts";
import type { StarlightClient } from "./client.ts";
import { entryKey } from "./refs.ts";

const directoryKey = (workspaceId: string) => ["directory", workspaceId] as const;

const listingKey = (workspaceId: string, directory: string | null, facet: "entries" | "media") =>
  [...directoryKey(workspaceId), directory, facet] as const;

const createQueries = (client: StarlightClient) => ({
  recentWorkspaces: () =>
    queryOptions({ queryKey: ["recentWorkspaces"], queryFn: () => client.workspaces.recent() }),

  workspace: (id: string) =>
    queryOptions({ queryKey: ["workspace", id], queryFn: () => client.workspaces.get(id) }),

  entries: (workspaceId: string, directory: EntryRef | null) =>
    queryOptions({
      queryKey: listingKey(workspaceId, directory && entryKey(directory), "entries"),
      queryFn: () => client.entries.list(workspaceId, directory),
    }),

  media: (workspaceId: string, directory: EntryRef | null) =>
    queryOptions({
      queryKey: listingKey(workspaceId, directory && entryKey(directory), "media"),
      queryFn: () => client.media.list(workspaceId, directory),
    }),

  fileSource: (workspaceId: string, directory: EntryRef, file: EntryRef) =>
    queryOptions({
      queryKey: [...directoryKey(workspaceId), entryKey(directory), "source", entryKey(file)],
      queryFn: () => client.media.source(workspaceId, file),
    }),

  agentProviders: () =>
    queryOptions({
      queryKey: ["agentProviders"],
      queryFn: () => client.agents.providers(),
      gcTime: Infinity,
      refetchOnMount: "always",
      refetchOnWindowFocus: "always",
    }),

  diskUsage: () =>
    queryOptions({
      queryKey: ["diskUsage"],
      queryFn: () => client.disk.usage(),
      staleTime: 0,
      refetchOnWindowFocus: true,
    }),

  update: () =>
    queryOptions({
      queryKey: ["update"],
      queryFn: streamedQuery<Update, Update | null>({
        streamFn: () => client.updates.watch(),
        reducer: (_, update) => update,
        initialValue: null,
      }),
      staleTime: Infinity,
    }),
});

const createMutations = (client: StarlightClient, queryClient: QueryClient, queries: Queries) => ({
  pickDirectory: () => mutationOptions({ mutationFn: () => client.shell.pickDirectory() }),

  downloadUpdate: () => mutationOptions({ mutationFn: () => client.updates.download() }),

  installUpdate: () => mutationOptions({ mutationFn: () => client.updates.install() }),

  clearPreviews: () =>
    mutationOptions({
      mutationFn: () => client.disk.clearPreviews(),
      onSettled: () => queryClient.invalidateQueries(queries.diskUsage()),
    }),

  openWorkspace: () =>
    mutationOptions({
      mutationFn: (root: EntryRef) => client.workspaces.open(root),
      onSuccess: (workspace) => {
        queryClient.setQueryData(queries.workspace(workspace.id).queryKey, workspace);
        return queryClient.invalidateQueries(queries.recentWorkspaces());
      },
    }),

  addMount: (workspaceId: string) =>
    mutationOptions({
      mutationFn: (root: EntryRef) => client.workspaces.addMount(workspaceId, root),
      onSuccess: (workspace) => {
        queryClient.setQueryData(queries.workspace(workspace.id).queryKey, workspace);
        return Promise.all([
          queryClient.invalidateQueries(queries.entries(workspace.id, null)),
          queryClient.invalidateQueries(queries.recentWorkspaces()),
        ]);
      },
    }),
});

const createSubscriptions = (client: StarlightClient, queryClient: QueryClient) => ({
  entries: (workspaceId: string) =>
    client.entries.watch(workspaceId, (change) => {
      if (change._tag === "Resync") {
        void queryClient.invalidateQueries({ queryKey: directoryKey(workspaceId) });
        return;
      }
      const stale = new Set(change.directories.map(entryKey));
      const isStale = (directory: string) =>
        stale.has(directory) ||
        (queryClient
          .getQueryData<Listing>(listingKey(workspaceId, directory, "entries"))
          ?.trail.some((crumb) => stale.has(entryKey(crumb.ref))) ??
          false);
      void queryClient.invalidateQueries({
        queryKey: directoryKey(workspaceId),
        predicate: ({ queryKey: [, , directory] }) => typeof directory === "string" && isStale(directory),
      });
    }),
});

export const createQueryOptions = (client: StarlightClient, queryClient: QueryClient) => {
  const queries = createQueries(client);
  return {
    queries,
    mutations: createMutations(client, queryClient, queries),
    subscriptions: createSubscriptions(client, queryClient),
  };
};

export type Queries = ReturnType<typeof createQueries>;
export type Mutations = ReturnType<typeof createMutations>;
export type Subscriptions = ReturnType<typeof createSubscriptions>;
