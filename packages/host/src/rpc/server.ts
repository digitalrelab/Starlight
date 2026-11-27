import { type Actor, HostRpcs } from "@starlight/contracts";
import { CurrentActor, Entries, Settings, Workspaces } from "@starlight/core";
import { Effect, Layer } from "effect";
import { RpcServer } from "effect/rpc";

const HandlersLive = HostRpcs.toLayer(
  Effect.gen(function* () {
    const workspaces = yield* Workspaces;
    const entries = yield* Entries;
    const settings = yield* Settings;
    return HostRpcs.of({
      OpenWorkspace: ({ path }) => workspaces.open(path),
      ListRecentWorkspaces: () => workspaces.recent,
      GetWorkspace: ({ workspaceId }) => workspaces.get(workspaceId),
      ListEntries: ({ workspaceId, path }) => entries.list(workspaceId, path),
      GetSettings: () => settings.get,
      UpdateSettings: (patch) => settings.update(patch),
    });
  }),
);

export const HostServerLive = (actor: Actor) =>
  RpcServer.layer(HostRpcs).pipe(
    Layer.provide(HandlersLive),
    Layer.provide(Layer.succeed(CurrentActor)(actor)),
  );
