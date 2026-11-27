import { type EntryChange, HostRpcs, ShellRpcs, type WorkspaceId } from "@starlight/contracts";
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
      open: (path: string) => host((c) => c.OpenWorkspace({ path })),
      recent: () => host((c) => c.ListRecentWorkspaces()),
      get: (workspaceId: string) => host((c) => c.GetWorkspace({ workspaceId: id(workspaceId) })),
    },
    entries: {
      list: (workspaceId: string, path: string) =>
        host((c) => c.ListEntries({ workspaceId: id(workspaceId), path })),
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
      list: (workspaceId: string, path: string) =>
        host((c) => c.ListMedia({ workspaceId: id(workspaceId), path })),
      source: (workspaceId: string, path: string) =>
        host((c) => c.GetFileSource({ workspaceId: id(workspaceId), path })),
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
