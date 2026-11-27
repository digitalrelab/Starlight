import { Layer } from "effect";
import { AgentProviders } from "./agents.ts";
import { Conversations } from "./conversations.ts";
import { Entries } from "./entries.ts";
import { MediaLibrary } from "./media.ts";
import { Workspaces } from "./workspaces.ts";

export * from "./agents.ts";
export * from "./conversations.ts";
export * from "./entries.ts";
export * from "./media.ts";
export * from "./ports.ts";
export * from "./workspaces.ts";

export const CoreLive = Layer.mergeAll(
  Entries.layer,
  MediaLibrary.layer,
  AgentProviders.layer,
  Conversations.layer,
).pipe(Layer.provideMerge(Workspaces.layer));
