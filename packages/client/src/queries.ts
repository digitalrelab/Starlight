import {
  experimental_streamedQuery as streamedQuery,
  mutationOptions,
  queryOptions,
  type QueryClient,
} from "@tanstack/react-query";
import type {
  ChatDetail,
  EntryRef,
  Listing,
  ModelChoice,
  UpdaterState,
  Workspace,
} from "@starlight/contracts";
import type { StarlightClient } from "./client.ts";
import { createFileSession, type FileSessionOptions } from "./file-session.ts";
import { entryKey } from "./refs.ts";

const directoryKey = (workspaceId: string) => ["directory", workspaceId] as const;

const listingKey = (workspaceId: string, directory: string | null, facet: "entries" | "media") =>
  [...directoryKey(workspaceId), directory, facet] as const;

const createQueries = (client: StarlightClient) => ({
  workspaces: () => queryOptions({ queryKey: ["workspaces"], queryFn: () => client.workspaces.list() }),

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
      queryFn: () => client.files.source(workspaceId, file),
    }),

  agentProviders: () =>
    queryOptions({
      queryKey: ["agentProviders"],
      queryFn: () => client.agents.providers(),
      gcTime: Infinity,
      refetchOnMount: "always",
      refetchOnWindowFocus: "always",
    }),

  chats: () => queryOptions({ queryKey: ["chats"], queryFn: () => client.chats.list() }),

  chat: (id: string) =>
    queryOptions({
      queryKey: ["chat", id],
      queryFn: () => client.chats.get(id),
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

const createMutations = (client: StarlightClient, queryClient: QueryClient, queries: Queries) => {
  const listKey = queries.workspaces().queryKey;
  const store = (workspace: Workspace) => {
    queryClient.setQueryData(queries.workspace(workspace.id).queryKey, workspace);
    queryClient.setQueryData(listKey, (list) =>
      list && list.some(({ id }) => id === workspace.id)
        ? list.map((existing) => (existing.id === workspace.id ? workspace : existing))
        : list && [...list, workspace],
    );
  };

  return {
    pickDirectory: () => mutationOptions({ mutationFn: () => client.shell.pickDirectory() }),

    checkForUpdates: () => mutationOptions({ mutationFn: () => client.updates.check() }),

    downloadUpdate: () => mutationOptions({ mutationFn: () => client.updates.download() }),

    installUpdate: () => mutationOptions({ mutationFn: () => client.updates.install() }),

    sendMessage: () =>
      mutationOptions({
        mutationFn: ({
          chatId,
          text,
          model,
        }: {
          readonly chatId: string | null;
          readonly text: string;
          readonly model: ModelChoice;
        }) => client.chats.send(chatId, text, model),
        onSuccess: () => queryClient.invalidateQueries(queries.chats()),
      }),

    clearPreviews: () =>
      mutationOptions({
        mutationFn: () => client.disk.clearPreviews(),
        onSettled: () => queryClient.invalidateQueries(queries.diskUsage()),
      }),

    renameChat: () =>
      mutationOptions({
        mutationFn: ({ chatId, title }: { readonly chatId: string; readonly title: string }) =>
          client.chats.rename(chatId, title),
        onSuccess: (chat) => {
          queryClient.setQueryData(queries.chat(chat.id).queryKey, (detail) => detail && { ...detail, chat });
          return queryClient.invalidateQueries(queries.chats());
        },
      }),

    deleteChat: () =>
      mutationOptions({
        mutationFn: (chatId: string) => client.chats.remove(chatId),
        onSuccess: (_, chatId) => {
          queryClient.removeQueries(queries.chat(chatId));
          return queryClient.invalidateQueries(queries.chats());
        },
      }),

    createWorkspace: () =>
      mutationOptions({
        mutationFn: (root: EntryRef) => client.workspaces.create(root),
        onSuccess: store,
      }),

    renameWorkspace: () =>
      mutationOptions({
        mutationFn: ({ workspaceId, name }: { readonly workspaceId: string; readonly name: string }) =>
          client.workspaces.rename(workspaceId, name),
        onSuccess: store,
      }),

    deleteWorkspace: () =>
      mutationOptions({
        mutationFn: (workspaceId: string) => client.workspaces.remove(workspaceId),
        onSuccess: (_, workspaceId) => {
          queryClient.setQueryData(listKey, (list) => list?.filter(({ id }) => id !== workspaceId));
          queryClient.removeQueries(queries.workspace(workspaceId));
          queryClient.removeQueries({ queryKey: directoryKey(workspaceId) });
        },
      }),

    addMount: (workspaceId: string) =>
      mutationOptions({
        mutationFn: (root: EntryRef) => client.workspaces.addMount(workspaceId, root),
        onSuccess: (workspace) => {
          store(workspace);
          return queryClient.invalidateQueries(queries.entries(workspaceId, null));
        },
      }),

    removeMount: (workspaceId: string) =>
      mutationOptions({
        mutationFn: (root: EntryRef) => client.workspaces.removeMount(workspaceId, root),
        onSuccess: (workspace) => {
          store(workspace);
          return queryClient.invalidateQueries({ queryKey: directoryKey(workspaceId) });
        },
      }),
  };
};

const createSubscriptions = (client: StarlightClient, queryClient: QueryClient, queries: Queries) => ({
  chat: (id: string) => {
    const { queryKey } = queries.chat(id);
    const update = (change: (detail: ChatDetail) => ChatDetail) =>
      queryClient.setQueryData(queryKey, (detail) => detail && change(detail));
    const has = (detail: ChatDetail, messageId: string) =>
      detail.messages.some((message) => message.id === messageId);

    return client.chats.watch(id, (event) => {
      switch (event._tag) {
        case "Snapshot":
          return queryClient.setQueryData(queryKey, event.detail);
        case "Draft":
          return update((detail) =>
            has(detail, event.draft.id) ? detail : { ...detail, draft: event.draft, failure: null },
          );
        case "MessageAdded":
          void queryClient.invalidateQueries(queries.chats());
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
  media: (workspaceId: string, directory: EntryRef) =>
    client.media.process(workspaceId, directory, (updates) => {
      const byKey = new Map(updates.map((update) => [entryKey(update.ref), update]));
      queryClient.setQueryData(queries.media(workspaceId, directory).queryKey, (media) =>
        media?.map((item) => {
          const update = byKey.get(entryKey(item.ref));
          return update ? { ...item, ...update } : item;
        }),
      );
    }),
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

const createSessions = (client: StarlightClient) => ({
  file: <T>(options: FileSessionOptions<T>) => createFileSession(client, options),
});

export const createQueryOptions = (client: StarlightClient, queryClient: QueryClient) => {
  const queries = createQueries(client);
  return {
    queries,
    mutations: createMutations(client, queryClient, queries),
    subscriptions: createSubscriptions(client, queryClient, queries),
    sessions: createSessions(client),
  };
};

export type Queries = ReturnType<typeof createQueries>;
export type Mutations = ReturnType<typeof createMutations>;
export type Subscriptions = ReturnType<typeof createSubscriptions>;
export type Sessions = ReturnType<typeof createSessions>;
