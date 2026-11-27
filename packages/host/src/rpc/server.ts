import { type Actor, HostRpcs } from "@starlight/contracts";
import { CurrentActor, Entries, MediaLibrary, Workspaces } from "@starlight/core";
import { Effect, Layer } from "effect";
import { RpcServer } from "effect/rpc";

const HandlersLive = HostRpcs.toLayer(
  Effect.gen(function* () {
    const workspaces = yield* Workspaces;
    const entries = yield* Entries;
    const media = yield* MediaLibrary;
    return HostRpcs.of({
      OpenWorkspace: ({ path }) => workspaces.open(path),
      ListRecentWorkspaces: () => workspaces.recent,
      GetWorkspace: ({ workspaceId }) => workspaces.get(workspaceId),
      ListEntries: ({ workspaceId, path }) => entries.list(workspaceId, path),
      WatchEntries: ({ workspaceId }) => entries.watch(workspaceId),
      ListMedia: ({ workspaceId, path }) => media.list(workspaceId, path),
      GetFileSource: ({ workspaceId, path }) => media.source(workspaceId, path),
    });
  }),
);

export const HostServerLive = (actor: Actor) =>
  RpcServer.layer(HostRpcs).pipe(
    Layer.provide(HandlersLive),
    Layer.provide(Layer.succeed(CurrentActor)(actor)),
  );
