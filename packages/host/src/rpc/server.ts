import { type Actor, HostRpcs } from "@starlight/contracts";
import {
  AgentProviders,
  Chats,
  CurrentActor,
  Entries,
  Files,
  MediaLibrary,
  Workspaces,
} from "@starlight/core";
import { Effect, Layer } from "effect";
import { RpcServer } from "effect/rpc";

const HandlersLive = HostRpcs.toLayer(
  Effect.gen(function* () {
    const workspaces = yield* Workspaces;
    const entries = yield* Entries;
    const files = yield* Files;
    const media = yield* MediaLibrary;
    const agentProviders = yield* AgentProviders;
    const chats = yield* Chats;
    return HostRpcs.of({
      CreateWorkspace: ({ root }) => workspaces.create(root),
      ListWorkspaces: () => workspaces.list,
      GetWorkspace: ({ workspaceId }) => workspaces.get(workspaceId),
      RenameWorkspace: ({ workspaceId, name }) => workspaces.rename(workspaceId, name),
      DeleteWorkspace: ({ workspaceId }) => workspaces.remove(workspaceId),
      AddMount: ({ workspaceId, root }) => workspaces.addMount(workspaceId, root),
      RemoveMount: ({ workspaceId, root }) => workspaces.removeMount(workspaceId, root),
      ListEntries: ({ workspaceId, directory }) => entries.list(workspaceId, directory),
      WatchEntries: ({ workspaceId }) => entries.watch(workspaceId),
      ListMedia: ({ workspaceId, directory }) => media.list(workspaceId, directory),
      ProcessMedia: ({ workspaceId, directory }) => media.process(workspaceId, directory),
      GetFileSource: ({ workspaceId, file }) => files.source(workspaceId, file),
      WriteFile: ({ workspaceId, file, content, base }) => files.write(workspaceId, file, content, base),
      ListAgentProviders: () => agentProviders.list,
      ListChats: () => chats.list,
      GetChat: ({ chatId }) => chats.get(chatId),
      SendMessage: ({ chatId, text, model }) => chats.send(chatId, text, model),
      RenameChat: ({ chatId, title }) => chats.rename(chatId, title),
      DeleteChat: ({ chatId }) => chats.remove(chatId),
      WatchChat: ({ chatId }) => chats.watch(chatId),
    });
  }),
);

export const HostServerLive = (actor: Actor) =>
  RpcServer.layer(HostRpcs).pipe(
    Layer.provide(HandlersLive),
    Layer.provide(Layer.succeed(CurrentActor)(actor)),
  );
