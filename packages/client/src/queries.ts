import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";
import type { StarlightClient } from "./client.ts";

export const queryKeys = {
  recentWorkspaces: () => ["recentWorkspaces"] as const,
  workspace: (id: string) => ["workspace", id] as const,
  entries: (workspaceId: string, path: string) => ["entries", workspaceId, path] as const,
};

export const createQueries = (client: StarlightClient) => ({
  recentWorkspaces: () =>
    queryOptions({ queryKey: queryKeys.recentWorkspaces(), queryFn: () => client.workspaces.recent() }),

  workspace: (id: string) =>
    queryOptions({ queryKey: queryKeys.workspace(id), queryFn: () => client.workspaces.get(id) }),

  entries: (workspaceId: string, path: string) =>
    queryOptions({
      queryKey: queryKeys.entries(workspaceId, path),
      queryFn: () => client.entries.list(workspaceId, path),
    }),
});

export const createMutations = (client: StarlightClient, queryClient: QueryClient) => ({
  pickDirectory: () => mutationOptions({ mutationFn: () => client.shell.pickDirectory() }),

  openWorkspace: () =>
    mutationOptions({
      mutationFn: (path: string) => client.workspaces.open(path),
      onSuccess: (workspace) => {
        queryClient.setQueryData(queryKeys.workspace(workspace.id), workspace);
        return queryClient.invalidateQueries({ queryKey: queryKeys.recentWorkspaces() });
      },
    }),
});

export type Queries = ReturnType<typeof createQueries>;
export type Mutations = ReturnType<typeof createMutations>;
