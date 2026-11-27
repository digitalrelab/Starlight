import { Layer } from "effect";
import { AgentProviders } from "./agents.ts";
import { EntryIndex } from "./entry-index.ts";
import { Catalog } from "./catalog.ts";
import { Chats } from "./chats.ts";
import { Entries } from "./entries.ts";
import { Files } from "./files.ts";
import { IndexerLive } from "./indexer.ts";
import { MediaLibrary } from "./media.ts";
import { Projects } from "./projects.ts";

export * from "./agents.ts";
export * from "./entry-index.ts";
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
  AgentProviders.layer,
  Chats.layer,
  IndexerLive,
).pipe(
  Layer.provideMerge(Catalog.layer),
  Layer.provideMerge(EntryIndex.layer),
  Layer.provideMerge(Projects.layer),
);
