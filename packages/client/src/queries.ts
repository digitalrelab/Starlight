import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";
import type { SettingsPatch } from "@starlight/contracts";
import type { StarlightClient } from "./client.ts";

export const createQueries = (client: StarlightClient) => ({
  recentWorkspaces: () =>
    queryOptions({ queryKey: ["recentWorkspaces"], queryFn: () => client.workspaces.recent() }),

  workspace: (id: string) =>
    queryOptions({ queryKey: ["workspace", id], queryFn: () => client.workspaces.get(id) }),

  entries: (workspaceId: string, path: string) =>
    queryOptions({
      queryKey: ["entries", workspaceId, path],
      queryFn: () => client.entries.list(workspaceId, path),
    }),

  settings: () => queryOptions({ queryKey: ["settings"], queryFn: () => client.settings.get() }),
});

export const createMutations = (client: StarlightClient, queryClient: QueryClient) => {
  const queries = createQueries(client);

  return {
    pickDirectory: () => mutationOptions({ mutationFn: () => client.shell.pickDirectory() }),

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
  };
};

export type Queries = ReturnType<typeof createQueries>;
export type Mutations = ReturnType<typeof createMutations>;
