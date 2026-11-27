import { type Actor, HostRpcs } from "@starlight/contracts";
import {
  AgentProviders,
  Conversations,
  CurrentActor,
  Entries,
  MediaLibrary,
  Workspaces,
} from "@starlight/core";
import { Effect, Layer } from "effect";
import { RpcServer } from "effect/rpc";

const HandlersLive = HostRpcs.toLayer(
  Effect.gen(function* () {
    const workspaces = yield* Workspaces;
    const entries = yield* Entries;
    const media = yield* MediaLibrary;
    const agentProviders = yield* AgentProviders;
    const conversations = yield* Conversations;
    return HostRpcs.of({
      OpenWorkspace: ({ root }) => workspaces.open(root),
      AddMount: ({ workspaceId, root }) => workspaces.addMount(workspaceId, root),
      ListRecentWorkspaces: () => workspaces.recent,
      GetWorkspace: ({ workspaceId }) => workspaces.get(workspaceId),
      ListEntries: ({ workspaceId, directory }) => entries.list(workspaceId, directory),
      WatchEntries: ({ workspaceId }) => entries.watch(workspaceId),
      ListMedia: ({ workspaceId, directory }) => media.list(workspaceId, directory),
      ListAgentProviders: () => agentProviders.list,
      ListConversations: () => conversations.list,
      GetConversation: ({ conversationId }) => conversations.get(conversationId),
      SendMessage: ({ conversationId, text }) => conversations.send(conversationId, text),
      WatchConversation: ({ conversationId }) => conversations.watch(conversationId),
    });
  }),
);

export const HostServerLive = (actor: Actor) =>
  RpcServer.layer(HostRpcs).pipe(
    Layer.provide(HandlersLive),
    Layer.provide(Layer.succeed(CurrentActor)(actor)),
  );
