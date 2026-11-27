import { type Actor, WorkspaceRpcs } from "@starlight/contracts";
import { CurrentActor, Entries, Workspaces } from "@starlight/core";
import { Effect, Layer } from "effect";
import { RpcServer } from "effect/rpc";

const HandlersLive = WorkspaceRpcs.toLayer(
  Effect.gen(function* () {
    const workspaces = yield* Workspaces;
    const entries = yield* Entries;
    return WorkspaceRpcs.of({
      OpenWorkspace: ({ path }) => workspaces.open(path),
      ListRecentWorkspaces: () => workspaces.recent,
      GetWorkspace: ({ workspaceId }) => workspaces.get(workspaceId),
      ListEntries: ({ workspaceId, path }) => entries.list(workspaceId, path),
    });
  }),
);

/** RPC server for one connection, bound to that connection's actor. */
export const WorkspaceServerLive = (actor: Actor) =>
  RpcServer.layer(WorkspaceRpcs).pipe(
    Layer.provide(HandlersLive),
    Layer.provide(Layer.succeed(CurrentActor)(actor)),
  );
