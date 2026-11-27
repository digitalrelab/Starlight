import { Layer } from "effect";
import { AgentProviders } from "./agents.ts";
import { FileIdentities } from "./file-identities.ts";
import { Catalog } from "./catalog.ts";
import { Chats } from "./chats.ts";
import { Entries } from "./entries.ts";
import { Files } from "./files.ts";
import { MediaLibrary } from "./media.ts";
import { Projects } from "./projects.ts";

export * from "./agents.ts";
export * from "./file-identities.ts";
export * from "./catalog.ts";
export * from "./chats.ts";
export * from "./entries.ts";
export * from "./files.ts";
export * from "./media.ts";
export * from "./ports.ts";
export * from "./projects.ts";

export const CoreLive = Layer.mergeAll(
  Entries.layer,
  Files.layer,
  MediaLibrary.layer,
  AgentProviders.layer.pipe(Layer.provideMerge(Chats.layer)),
).pipe(
  Layer.provideMerge(Catalog.layer),
  Layer.provideMerge(FileIdentities.layer),
  Layer.provideMerge(Projects.layer),
);
