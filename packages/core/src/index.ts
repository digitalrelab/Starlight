import { Layer } from "effect";
import { AgentTools } from "./agent-tools.ts";
import { AgentProviders } from "./agents.ts";
import { EntryIndex } from "./entry-index.ts";
import { Catalog } from "./catalog.ts";
import { Chats } from "./chats.ts";
import { Entries } from "./entries.ts";
import { Files } from "./files.ts";
import { IndexerLive } from "./indexer.ts";
import { MediaLibrary } from "./media.ts";
import { Projects } from "./projects.ts";
import { References } from "./references.ts";
import { EntrySearch } from "./search.ts";

export * from "./agent-tools.ts";
export * from "./agents.ts";
export * from "./entry-index.ts";
export * from "./catalog.ts";
export * from "./chats.ts";
export * from "./entries.ts";
export * from "./files.ts";
export * from "./media.ts";
export * from "./ports.ts";
export * from "./projects.ts";
export * from "./references.ts";
export * from "./search.ts";

export const CoreLive = Layer.mergeAll(
  MediaLibrary.layer,
  AgentProviders.layer,
  Chats.layer.pipe(Layer.provide(AgentTools.layer)),
  References.layer,
  IndexerLive,
).pipe(
  Layer.provideMerge(Layer.mergeAll(Entries.layer, Files.layer)),
  Layer.provideMerge(EntrySearch.layer),
  Layer.provideMerge(Catalog.layer),
  Layer.provideMerge(EntryIndex.layer),
  Layer.provideMerge(Projects.layer),
);
