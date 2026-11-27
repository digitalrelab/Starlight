import {
  experimental_streamedQuery as streamedQuery,
  mutationOptions,
  queryOptions,
  type QueryClient,
} from "@tanstack/react-query";
import type { ConversationDetail, EntryRef, Listing, ModelChoice, UpdaterState } from "@starlight/contracts";
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

  conversations: () =>
    queryOptions({ queryKey: ["conversations"], queryFn: () => client.conversations.list() }),

  conversation: (id: string) =>
    queryOptions({
      queryKey: ["conversation", id],
      queryFn: () => client.conversations.get(id),
      staleTime: Infinity,
    }),

  diskUsage: () =>
    queryOptions({
      queryKey: ["diskUsage"],
      queryFn: () => client.disk.usage(),
      staleTime: 0,
      refetchOnWindowFocus: true,
    }),

  updater: () =>
    queryOptions({
      queryKey: ["updater"],
      queryFn: streamedQuery<UpdaterState, UpdaterState | null>({
        streamFn: () => client.updates.watch(),
        reducer: (_, state) => state,
        initialValue: null,
      }),
      staleTime: Infinity,
    }),
});

const createMutations = (client: StarlightClient, queryClient: QueryClient, queries: Queries) => ({
  pickDirectory: () => mutationOptions({ mutationFn: () => client.shell.pickDirectory() }),

  checkForUpdates: () => mutationOptions({ mutationFn: () => client.updates.check() }),

  downloadUpdate: () => mutationOptions({ mutationFn: () => client.updates.download() }),

  installUpdate: () => mutationOptions({ mutationFn: () => client.updates.install() }),

  sendMessage: () =>
    mutationOptions({
      mutationFn: ({
        conversationId,
        text,
        model,
      }: {
        readonly conversationId: string | null;
        readonly text: string;
        readonly model: ModelChoice;
      }) => client.conversations.send(conversationId, text, model),
      onSuccess: () => queryClient.invalidateQueries(queries.conversations()),
    }),

  clearPreviews: () =>
    mutationOptions({
      mutationFn: () => client.disk.clearPreviews(),
      onSettled: () => queryClient.invalidateQueries(queries.diskUsage()),
    }),

  renameConversation: () =>
    mutationOptions({
      mutationFn: ({ conversationId, title }: { readonly conversationId: string; readonly title: string }) =>
        client.conversations.rename(conversationId, title),
      onSuccess: (conversation) => {
        queryClient.setQueryData(
          queries.conversation(conversation.id).queryKey,
          (detail) => detail && { ...detail, conversation },
        );
        return queryClient.invalidateQueries(queries.conversations());
      },
    }),

  deleteConversation: () =>
    mutationOptions({
      mutationFn: (conversationId: string) => client.conversations.remove(conversationId),
      onSuccess: (_, conversationId) => {
        queryClient.removeQueries(queries.conversation(conversationId));
        return queryClient.invalidateQueries(queries.conversations());
      },
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

const createSubscriptions = (client: StarlightClient, queryClient: QueryClient, queries: Queries) => ({
  conversation: (id: string) => {
    const { queryKey } = queries.conversation(id);
    const update = (change: (detail: ConversationDetail) => ConversationDetail) =>
      queryClient.setQueryData(queryKey, (detail) => detail && change(detail));
    const has = (detail: ConversationDetail, messageId: string) =>
      detail.messages.some((message) => message.id === messageId);

    return client.conversations.watch(id, (event) => {
      switch (event._tag) {
        case "Snapshot":
          return queryClient.setQueryData(queryKey, event.detail);
        case "Draft":
          return update((detail) =>
            has(detail, event.draft.id) ? detail : { ...detail, draft: event.draft, failure: null },
          );
        case "MessageAdded":
          void queryClient.invalidateQueries(queries.conversations());
          return update((detail) => ({
            ...detail,
            messages: has(detail, event.message.id) ? detail.messages : [...detail.messages, event.message],
            draft: detail.draft?.id === event.message.id ? null : detail.draft,
          }));
        case "TurnFailed":
          return update((detail) => ({ ...detail, draft: null, failure: event.message }));
      }
    });
  },
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
    subscriptions: createSubscriptions(client, queryClient, queries),
  };
};

export type Queries = ReturnType<typeof createQueries>;
export type Mutations = ReturnType<typeof createMutations>;
export type Subscriptions = ReturnType<typeof createSubscriptions>;
