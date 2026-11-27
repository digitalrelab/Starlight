import { type Actor, HostRpcs } from "@starlight/contracts";
import { AgentProviders, Chats, CurrentActor, Entries, Files, MediaLibrary, Projects } from "@starlight/core";
import { Effect, Layer } from "effect";
import { RpcServer } from "effect/rpc";

const HandlersLive = HostRpcs.toLayer(
  Effect.gen(function* () {
    const projects = yield* Projects;
    const entries = yield* Entries;
    const files = yield* Files;
    const media = yield* MediaLibrary;
    const agentProviders = yield* AgentProviders;
    const chats = yield* Chats;
    return HostRpcs.of({
      CreateProject: ({ root }) => projects.create(root),
      ListProjects: () => projects.list,
      GetProject: ({ projectId }) => projects.get(projectId),
      RenameProject: ({ projectId, name }) => projects.rename(projectId, name),
      DeleteProject: ({ projectId }) => projects.remove(projectId),
      AddMount: ({ projectId, root }) => projects.addMount(projectId, root),
      RemoveMount: ({ projectId, root }) => projects.removeMount(projectId, root),
      ListEntries: ({ projectId, directory }) => entries.list(projectId, directory),
      CreateEntry: ({ projectId, directory, name, kind }) => entries.create(projectId, directory, name, kind),
      WatchEntries: ({ projectId }) => entries.watch(projectId),
      ListMedia: ({ projectId, directory }) => media.list(projectId, directory),
      ProcessMedia: ({ projectId, directory }) => media.process(projectId, directory),
      GetFileSource: ({ projectId, file }) => files.source(projectId, file),
      LocateEntry: ({ ref }) => projects.locateEntry(ref),
      GetFileDetails: ({ projectId, file }) => files.details(projectId, file),
      WriteFile: ({ projectId, file, content, base }) => files.write(projectId, file, content, base),
      ListAgentProviders: () => agentProviders.list,
      PrepareAgentProviders: () => agentProviders.prepare,
      GetAgentUsage: () => agentProviders.usage,
      ListChats: ({ projectId }) => chats.list(projectId),
      GetChat: ({ chatId }) => chats.get(chatId),
      StartChat: ({ projectId, text, model }) => chats.start(projectId, text, model),
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
