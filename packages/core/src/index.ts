import { Layer } from "effect";
import { AgentProviders } from "./agents.ts";
import { EntryIndex } from "./entry-index.ts";
import { IgnoreRules } from "./ignore-rules.ts";
import { Catalog } from "./catalog.ts";
import { Chats } from "./chats.ts";
import { Entries } from "./entries.ts";
import { Files } from "./files.ts";
import { IndexerLive } from "./indexer.ts";
import { MediaLibrary } from "./media.ts";
import { Projects } from "./projects.ts";
import { References } from "./references.ts";
import { EntrySearch } from "./search.ts";

export * from "./agents.ts";
export * from "./entry-index.ts";
export * from "./ignore-rules.ts";
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
  Entries.layer,
  Files.layer,
  MediaLibrary.layer,
  AgentProviders.layer,
  Chats.layer,
  References.layer,
  IndexerLive,
).pipe(
  Layer.provideMerge(EntrySearch.layer),
  Layer.provideMerge(Catalog.layer),
  Layer.provideMerge(EntryIndex.layer),
  Layer.provideMerge(IgnoreRules.layer),
  Layer.provideMerge(Projects.layer),
);
