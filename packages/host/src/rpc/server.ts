import { type Actor, HostRpcs } from "@starlight/contracts";
import { CurrentActor, Entries, Workspaces } from "@starlight/core";
import { Effect, Layer } from "effect";
import { RpcServer } from "effect/rpc";

const HandlersLive = HostRpcs.toLayer(
  Effect.gen(function* () {
    const workspaces = yield* Workspaces;
    const entries = yield* Entries;
    return HostRpcs.of({
      OpenWorkspace: ({ path }) => workspaces.open(path),
      ListRecentWorkspaces: () => workspaces.recent,
      GetWorkspace: ({ workspaceId }) => workspaces.get(workspaceId),
      ListEntries: ({ workspaceId, path }) => entries.list(workspaceId, path),
      WatchEntries: ({ workspaceId }) => entries.watch(workspaceId),
    });
  }),
);

export const HostServerLive = (actor: Actor) =>
  RpcServer.layer(HostRpcs).pipe(
    Layer.provide(HandlersLive),
    Layer.provide(Layer.succeed(CurrentActor)(actor)),
  );
