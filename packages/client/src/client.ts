import {
  type EntryChange,
  type EntryRef,
  HostRpcs,
  type SettingsPatch,
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
  const id = (workspaceId: string) => workspaceId as WorkspaceId;

  return {
    workspaces: {
      open: (root: EntryRef) => host((c) => c.OpenWorkspace({ root })),
      addMount: (workspaceId: string, root: EntryRef) =>
        host((c) => c.AddMount({ workspaceId: id(workspaceId), root })),
      recent: () => host((c) => c.ListRecentWorkspaces()),
      get: (workspaceId: string) => host((c) => c.GetWorkspace({ workspaceId: id(workspaceId) })),
    },
    entries: {
      list: (workspaceId: string, directory: EntryRef | null) =>
        host((c) => c.ListEntries({ workspaceId: id(workspaceId), directory })),
      watch: (workspaceId: string, onChange: (change: EntryChange) => void) => {
        const fiber = runtime.runFork(
          Host.use((c) =>
            c
              .WatchEntries({ workspaceId: id(workspaceId) })
              .pipe(Stream.runForEach((change) => Effect.sync(() => onChange(change)))),
          ).pipe(Effect.catchCause((cause) => Effect.logWarning("Entries watch ended", cause))),
        );
        return () => fiber.interruptUnsafe();
      },
    },
    media: {
      list: (workspaceId: string, directory: EntryRef | null) =>
        host((c) => c.ListMedia({ workspaceId: id(workspaceId), directory })),
    },
    settings: {
      get: () => host((c) => c.GetSettings()),
      update: (patch: SettingsPatch) => host((c) => c.UpdateSettings(patch)),
    },
    shell: {
      pickDirectory: () => shell((c) => c.PickDirectory()),
    },
    updates: {
      watch: () => shell((c) => Stream.toAsyncIterableEffect(c.WatchUpdates())),
      download: () => shell((c) => c.DownloadUpdate()),
      install: () => shell((c) => c.InstallUpdate()),
    },
  };
};

export type StarlightClient = ReturnType<typeof createClient>;
