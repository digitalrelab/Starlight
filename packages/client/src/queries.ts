import {
  experimental_streamedQuery as streamedQuery,
  mutationOptions,
  queryOptions,
  type QueryClient,
} from "@tanstack/react-query";
import type { ChatDetail, EntryRef, Listing, ModelChoice, Project, UpdaterState } from "@starlight/contracts";
import type { StarlightClient } from "./client.ts";
import { createFileSession, type FileSessionOptions } from "./file-session.ts";
import { entryKey } from "./refs.ts";

const directoryKey = (projectId: string) => ["directory", projectId] as const;

const listingKey = (projectId: string, directory: string | null, facet: "entries" | "media") =>
  [...directoryKey(projectId), directory, facet] as const;

const chatsKey = ["chats"] as const;
const chatKey = ["chat"] as const;

const createQueries = (client: StarlightClient) => ({
  projects: () => queryOptions({ queryKey: ["projects"], queryFn: () => client.projects.list() }),

  project: (id: string) =>
    queryOptions({ queryKey: ["project", id], queryFn: () => client.projects.get(id) }),

  entries: (projectId: string, directory: EntryRef | null) =>
    queryOptions({
      queryKey: listingKey(projectId, directory && entryKey(directory), "entries"),
      queryFn: () => client.entries.list(projectId, directory),
    }),

  media: (projectId: string, directory: EntryRef | null) =>
    queryOptions({
      queryKey: listingKey(projectId, directory && entryKey(directory), "media"),
      queryFn: () => client.media.list(projectId, directory),
    }),

  fileSource: (projectId: string, directory: EntryRef, file: EntryRef) =>
    queryOptions({
      queryKey: [...directoryKey(projectId), entryKey(directory), "source", entryKey(file)],
      queryFn: () => client.files.source(projectId, file),
    }),

  fileDetails: (projectId: string, directory: EntryRef, file: EntryRef) =>
    queryOptions({
      queryKey: [...directoryKey(projectId), entryKey(directory), "details", entryKey(file)],
      queryFn: () => client.files.details(projectId, file),
    }),

  agentProviders: () =>
    queryOptions({
      queryKey: ["agentProviders"],
      queryFn: () => client.agents.providers(),
      gcTime: Infinity,
      refetchOnMount: "always",
      refetchOnWindowFocus: "always",
    }),

  agentUsage: () =>
    queryOptions({
      queryKey: ["agentUsage"],
      queryFn: () => client.agents.usage(),
      refetchOnWindowFocus: true,
    }),

  chats: (projectId: string | null) =>
    queryOptions({ queryKey: [...chatsKey, projectId], queryFn: () => client.chats.list(projectId) }),

  chat: (id: string) =>
    queryOptions({
      queryKey: [...chatKey, id],
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

const cacheProject = (queryClient: QueryClient, queries: Queries, project: Project) => {
  queryClient.setQueryData(queries.project(project.id).queryKey, project);
  queryClient.setQueryData(queries.projects().queryKey, (list) => {
    if (!list) return list;
    const index = list.findIndex(({ id }) => id === project.id);
    return index === -1 ? [...list, project] : list.with(index, project);
  });
};

const createMutations = (client: StarlightClient, queryClient: QueryClient, queries: Queries) => ({
  pickDirectory: () => mutationOptions({ mutationFn: () => client.shell.pickDirectory() }),

  checkForUpdates: () => mutationOptions({ mutationFn: () => client.updates.check() }),

  downloadUpdate: () => mutationOptions({ mutationFn: () => client.updates.download() }),

  installUpdate: () => mutationOptions({ mutationFn: () => client.updates.install() }),

  startChat: () =>
    mutationOptions({
      mutationFn: ({
        projectId,
        text,
        model,
      }: {
        readonly projectId: string | null;
        readonly text: string;
        readonly model: ModelChoice;
      }) => client.chats.start(projectId, text, model),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: chatsKey }),
    }),

  sendMessage: () =>
    mutationOptions({
      mutationFn: ({
        chatId,
        text,
        model,
      }: {
        readonly chatId: string;
        readonly text: string;
        readonly model: ModelChoice;
      }) => client.chats.send(chatId, text, model),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: chatsKey }),
    }),

  clearPreviews: () =>
    mutationOptions({
      mutationFn: () => client.disk.clearPreviews(),
      onSettled: () => queryClient.invalidateQueries(queries.diskUsage()),
    }),

  prepareAgentProviders: () => mutationOptions({ mutationFn: () => client.agents.prepare() }),

  renameChat: () =>
    mutationOptions({
      mutationFn: ({ chatId, title }: { readonly chatId: string; readonly title: string }) =>
        client.chats.rename(chatId, title),
      onSuccess: (chat) => {
        queryClient.setQueryData(queries.chat(chat.id).queryKey, (detail) => detail && { ...detail, chat });
        return queryClient.invalidateQueries({ queryKey: chatsKey });
      },
    }),

  deleteChat: () =>
    mutationOptions({
      mutationFn: (chatId: string) => client.chats.remove(chatId),
      onSuccess: (_, chatId) => {
        queryClient.removeQueries(queries.chat(chatId));
        return queryClient.invalidateQueries({ queryKey: chatsKey });
      },
    }),

  createProject: () =>
    mutationOptions({
      mutationFn: (root: EntryRef) => client.projects.create(root),
      onSuccess: (project) => cacheProject(queryClient, queries, project),
    }),

  renameProject: () =>
    mutationOptions({
      mutationFn: ({ projectId, name }: { readonly projectId: string; readonly name: string }) =>
        client.projects.rename(projectId, name),
      onSuccess: (project) => cacheProject(queryClient, queries, project),
    }),

  deleteProject: () =>
    mutationOptions({
      mutationFn: (projectId: string) => client.projects.remove(projectId),
      onSuccess: (_, projectId) => {
        queryClient.setQueryData(queries.projects().queryKey, (list) =>
          list?.filter(({ id }) => id !== projectId),
        );
        queryClient.removeQueries(queries.project(projectId));
        queryClient.removeQueries({ queryKey: directoryKey(projectId) });
        return Promise.all([
          queryClient.invalidateQueries({ queryKey: chatsKey }),
          queryClient.invalidateQueries({ queryKey: chatKey }),
        ]);
      },
    }),

  addMount: (projectId: string) =>
    mutationOptions({
      mutationFn: (root: EntryRef) => client.projects.addMount(projectId, root),
      onSuccess: (project) => {
        cacheProject(queryClient, queries, project);
        return queryClient.invalidateQueries(queries.entries(projectId, null));
      },
    }),

  removeMount: (projectId: string) =>
    mutationOptions({
      mutationFn: (root: EntryRef) => client.projects.removeMount(projectId, root),
      onSuccess: (project) => {
        cacheProject(queryClient, queries, project);
        return queryClient.invalidateQueries({ queryKey: directoryKey(projectId) });
      },
    }),
});

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
          void queryClient.invalidateQueries({ queryKey: chatsKey });
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
  media: (projectId: string, directory: EntryRef) =>
    client.media.process(projectId, directory, (updates) => {
      const byKey = new Map(updates.map((update) => [entryKey(update.ref), update]));
      queryClient.setQueryData(queries.media(projectId, directory).queryKey, (media) =>
        media?.map((item) => {
          const update = byKey.get(entryKey(item.ref));
          return update ? { ...item, ...update } : item;
        }),
      );
      void queryClient.invalidateQueries({
        queryKey: [...directoryKey(projectId), entryKey(directory), "details"],
        predicate: ({ queryKey }) => byKey.has(String(queryKey.at(-1))),
      });
    }),
  entries: (projectId: string) =>
    client.entries.watch(projectId, (change) => {
      if (change._tag === "Resync") {
        void queryClient.invalidateQueries({ queryKey: directoryKey(projectId) });
        return;
      }
      const stale = new Set(change.directories.map(entryKey));
      const isStale = (directory: string) =>
        stale.has(directory) ||
        (queryClient
          .getQueryData<Listing>(listingKey(projectId, directory, "entries"))
          ?.trail.some((crumb) => stale.has(entryKey(crumb.ref))) ??
          false);
      void queryClient.invalidateQueries({
        queryKey: directoryKey(projectId),
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
