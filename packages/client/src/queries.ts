import {
  experimental_streamedQuery as streamedQuery,
  mutationOptions,
  queryOptions,
  type QueryClient,
} from "@tanstack/react-query";
import { parentOf, type SettingsPatch, type Update } from "@starlight/contracts";
import type { StarlightClient } from "./client.ts";

const directoryKey = (workspaceId: string) => ["directory", workspaceId] as const;

const listingsAffectedBy = (paths: ReadonlyArray<string>) => {
  const changed = new Set(paths);
  const parents = new Set(paths.map(parentOf));
  return (directory: string) => {
    if (parents.has(directory)) return true;
    for (let path = directory; ; path = parentOf(path)) {
      if (changed.has(path)) return true;
      if (path === "") return false;
    }
  };
};

const createQueries = (client: StarlightClient) => ({
  recentWorkspaces: () =>
    queryOptions({ queryKey: ["recentWorkspaces"], queryFn: () => client.workspaces.recent() }),

  workspace: (id: string) =>
    queryOptions({ queryKey: ["workspace", id], queryFn: () => client.workspaces.get(id) }),

  entries: (workspaceId: string, path: string) =>
    queryOptions({
      queryKey: [...directoryKey(workspaceId), path, "entries"],
      queryFn: () => client.entries.list(workspaceId, path),
    }),

  media: (workspaceId: string, path: string) =>
    queryOptions({
      queryKey: [...directoryKey(workspaceId), path, "media"],
      queryFn: () => client.media.list(workspaceId, path),
    }),

  settings: () => queryOptions({ queryKey: ["settings"], queryFn: () => client.settings.get() }),

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

  openWorkspace: () =>
    mutationOptions({
      mutationFn: (path: string) => client.workspaces.open(path),
      onSuccess: (workspace) => {
        queryClient.setQueryData(queries.workspace(workspace.id).queryKey, workspace);
        return queryClient.invalidateQueries(queries.recentWorkspaces());
      },
    }),

  updateSettings: () => {
    const { queryKey } = queries.settings();
    return mutationOptions({
      scope: { id: "settings" },
      mutationFn: (patch: SettingsPatch) => client.settings.update(patch),
      onMutate: async (patch) => {
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData(queryKey);
        if (previous) queryClient.setQueryData(queryKey, { ...previous, ...patch });
        return { previous };
      },
      onError: (_error, _patch, result) => {
        if (result?.previous) queryClient.setQueryData(queryKey, result.previous);
      },
      onSuccess: (settings) => queryClient.setQueryData(queryKey, settings),
    });
  },
});

const createSubscriptions = (client: StarlightClient, queryClient: QueryClient) => ({
  entries: (workspaceId: string) =>
    client.entries.watch(workspaceId, (change) => {
      const affected = change._tag === "Changed" ? listingsAffectedBy(change.paths) : () => true;
      void queryClient.invalidateQueries({
        queryKey: directoryKey(workspaceId),
        predicate: ({ queryKey: [, , directory] }) => typeof directory === "string" && affected(directory),
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
