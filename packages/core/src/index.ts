import { Layer } from "effect";
import { AgentProviders } from "./agents.ts";
import { Assets } from "./assets.ts";
import { Catalog } from "./catalog.ts";
import { Chats } from "./chats.ts";
import { Entries } from "./entries.ts";
import { Files } from "./files.ts";
import { MediaLibrary } from "./media.ts";
import { Workspaces } from "./workspaces.ts";

export * from "./agents.ts";
export * from "./assets.ts";
export * from "./catalog.ts";
export * from "./chats.ts";
export * from "./entries.ts";
export * from "./files.ts";
export * from "./media.ts";
export * from "./ports.ts";
export * from "./workspaces.ts";

export const CoreLive = Layer.mergeAll(
  Entries.layer,
  Files.layer,
  MediaLibrary.layer,
  AgentProviders.layer,
  Chats.layer,
).pipe(
  Layer.provideMerge(Catalog.layer),
  Layer.provideMerge(Assets.layer),
  Layer.provideMerge(Workspaces.layer),
);
