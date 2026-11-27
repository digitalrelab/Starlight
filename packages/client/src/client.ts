import {
  type ChatEvent,
  type ChatId,
  type EntryChange,
  type EntryRef,
  type FileVersion,
  HostRpcs,
  type ModelChoice,
  ShellRpcs,
  type WorkspaceId,
} from "@starlight/contracts";
import { Context, Effect, Layer, ManagedRuntime, Stream } from "effect";
import { RpcClient, type RpcClientError } from "effect/rpc";
import { layerProtocolPort } from "./transport.ts";

type HostClient = RpcClient.FromGroup<typeof HostRpcs, RpcClientError.RpcClientError>;
type ShellClient = RpcClient.FromGroup<typeof ShellRpcs, RpcClientError.RpcClientError>;

class Host extends Context.Service<Host, HostClient>()("@starlight/client/Host") {}
class Shell extends Context.Service<Shell, ShellClient>()("@starlight/client/Shell") {}

export interface PortSources {
  readonly host: () => Promise<MessagePort>;
  readonly shell: () => Promise<MessagePort>;
}

export const createClient = (ports: PortSources) => {
  const runtime = ManagedRuntime.make(
    Layer.mergeAll(
      Layer.effect(Host)(RpcClient.make(HostRpcs)).pipe(Layer.provide(layerProtocolPort(ports.host))),
      Layer.effect(Shell)(RpcClient.make(ShellRpcs)).pipe(Layer.provide(layerProtocolPort(ports.shell))),
    ),
  );
  const host = <A, E>(f: (client: HostClient) => Effect.Effect<A, E>) => runtime.runPromise(Host.use(f));
  const shell = <A, E>(f: (client: ShellClient) => Effect.Effect<A, E>) => runtime.runPromise(Shell.use(f));
  const watch = <A, E>(
    name: string,
    stream: (client: HostClient) => Stream.Stream<A, E>,
    onEvent: (event: A) => void,
  ) => {
    const fiber = runtime.runFork(
      Host.use((c) => stream(c).pipe(Stream.runForEach((event) => Effect.sync(() => onEvent(event))))).pipe(
        Effect.catchCause((cause) => Effect.logWarning(`${name} watch ended`, cause)),
      ),
    );
    return () => fiber.interruptUnsafe();
  };
  const id = (workspaceId: string) => workspaceId as WorkspaceId;
  const chat = (chatId: string) => chatId as ChatId;

  return {
    workspaces: {
      create: (root: EntryRef) => host((c) => c.CreateWorkspace({ root })),
      list: () => host((c) => c.ListWorkspaces()),
      get: (workspaceId: string) => host((c) => c.GetWorkspace({ workspaceId: id(workspaceId) })),
      rename: (workspaceId: string, name: string) =>
        host((c) => c.RenameWorkspace({ workspaceId: id(workspaceId), name })),
      remove: (workspaceId: string) => host((c) => c.DeleteWorkspace({ workspaceId: id(workspaceId) })),
      addMount: (workspaceId: string, root: EntryRef) =>
        host((c) => c.AddMount({ workspaceId: id(workspaceId), root })),
      removeMount: (workspaceId: string, root: EntryRef) =>
        host((c) => c.RemoveMount({ workspaceId: id(workspaceId), root })),
    },
    entries: {
      list: (workspaceId: string, directory: EntryRef | null) =>
        host((c) => c.ListEntries({ workspaceId: id(workspaceId), directory })),
      watch: (workspaceId: string, onChange: (change: EntryChange) => void) =>
        watch("Entries", (c) => c.WatchEntries({ workspaceId: id(workspaceId) }), onChange),
    },
    media: {
      list: (workspaceId: string, directory: EntryRef | null) =>
        host((c) => c.ListMedia({ workspaceId: id(workspaceId), directory })),
    },
    files: {
      source: (workspaceId: string, file: EntryRef) =>
        host((c) => c.GetFileSource({ workspaceId: id(workspaceId), file })),
      write: (workspaceId: string, file: EntryRef, content: Uint8Array, base: FileVersion) =>
        host((c) => c.WriteFile({ workspaceId: id(workspaceId), file, content, base })),
    },
    agents: {
      providers: () => host((c) => c.ListAgentProviders()),
    },
    chats: {
      list: () => host((c) => c.ListChats()),
      get: (chatId: string) => host((c) => c.GetChat({ chatId: chat(chatId) })),
      send: (chatId: string | null, text: string, model: ModelChoice) =>
        host((c) =>
          c.SendMessage({
            chatId: chatId === null ? null : chat(chatId),
            text,
            model,
          }),
        ),
      rename: (chatId: string, title: string) => host((c) => c.RenameChat({ chatId: chat(chatId), title })),
      remove: (chatId: string) => host((c) => c.DeleteChat({ chatId: chat(chatId) })),
      watch: (chatId: string, onEvent: (event: ChatEvent) => void) =>
        watch("Chat", (c) => c.WatchChat({ chatId: chat(chatId) }), onEvent),
    },
    shell: {
      pickDirectory: () => shell((c) => c.PickDirectory()),
    },
    disk: {
      usage: () => shell((c) => c.GetDiskUsage()),
      clearPreviews: () => shell((c) => c.ClearPreviews()),
    },
    updates: {
      watch: () => shell((c) => Stream.toAsyncIterableEffect(c.WatchUpdater())),
      check: () => shell((c) => c.CheckForUpdates()),
      download: () => shell((c) => c.DownloadUpdate()),
      install: () => shell((c) => c.InstallUpdate()),
    },
  };
};

export type StarlightClient = ReturnType<typeof createClient>;
