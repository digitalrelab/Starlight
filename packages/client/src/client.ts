import {
  type ChatEvent,
  type ChatId,
  type EntryChange,
  type EntryRef,
  type FileVersion,
  type MediaUpdate,
  HostRpcs,
  type ModelChoice,
  ShellRpcs,
  type ProjectId,
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
  const id = (projectId: string) => projectId as ProjectId;
  const optionalId = (projectId: string | null) => projectId as ProjectId | null;
  const chat = (chatId: string) => chatId as ChatId;

  return {
    projects: {
      create: (root: EntryRef) => host((c) => c.CreateProject({ root })),
      list: () => host((c) => c.ListProjects()),
      get: (projectId: string) => host((c) => c.GetProject({ projectId: id(projectId) })),
      rename: (projectId: string, name: string) =>
        host((c) => c.RenameProject({ projectId: id(projectId), name })),
      remove: (projectId: string) => host((c) => c.DeleteProject({ projectId: id(projectId) })),
      addMount: (projectId: string, root: EntryRef) =>
        host((c) => c.AddMount({ projectId: id(projectId), root })),
      removeMount: (projectId: string, root: EntryRef) =>
        host((c) => c.RemoveMount({ projectId: id(projectId), root })),
    },
    entries: {
      list: (projectId: string, directory: EntryRef | null) =>
        host((c) => c.ListEntries({ projectId: id(projectId), directory })),
      watch: (projectId: string, onChange: (change: EntryChange) => void) =>
        watch("Entries", (c) => c.WatchEntries({ projectId: id(projectId) }), onChange),
      locate: (ref: EntryRef) => host((c) => c.LocateEntry({ ref })),
    },
    media: {
      list: (projectId: string, directory: EntryRef | null) =>
        host((c) => c.ListMedia({ projectId: id(projectId), directory })),
      process: (
        projectId: string,
        directory: EntryRef,
        onUpdates: (updates: ReadonlyArray<MediaUpdate>) => void,
      ) => watch("Media", (c) => c.ProcessMedia({ projectId: id(projectId), directory }), onUpdates),
    },
    files: {
      source: (projectId: string, file: EntryRef) =>
        host((c) => c.GetFileSource({ projectId: id(projectId), file })),
      details: (projectId: string, file: EntryRef) =>
        host((c) => c.GetFileDetails({ projectId: id(projectId), file })),
      write: (projectId: string, file: EntryRef, content: Uint8Array, base: FileVersion) =>
        host((c) => c.WriteFile({ projectId: id(projectId), file, content, base })),
    },
    agents: {
      providers: () => host((c) => c.ListAgentProviders()),
      prepare: () => host((c) => c.PrepareAgentProviders()),
      usage: () => host((c) => c.GetAgentUsage()),
    },
    chats: {
      list: (projectId: string | null) => host((c) => c.ListChats({ projectId: optionalId(projectId) })),
      get: (chatId: string) => host((c) => c.GetChat({ chatId: chat(chatId) })),
      start: (projectId: string | null, text: string, model: ModelChoice) =>
        host((c) => c.StartChat({ projectId: optionalId(projectId), text, model })),
      send: (chatId: string, text: string, model: ModelChoice) =>
        host((c) => c.SendMessage({ chatId: chat(chatId), text, model })),
      rename: (chatId: string, title: string) => host((c) => c.RenameChat({ chatId: chat(chatId), title })),
      remove: (chatId: string) => host((c) => c.DeleteChat({ chatId: chat(chatId) })),
      watch: (chatId: string, onEvent: (event: ChatEvent) => void) =>
        watch("Chat", (c) => c.WatchChat({ chatId: chat(chatId) }), onEvent),
      watchSettled: (onSettled: () => void) =>
        watch("Settled turns", (c) => c.WatchSettledTurns(), onSettled),
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
