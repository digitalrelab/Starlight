import { Layer } from "effect";
import { Entries } from "./entries.ts";
import { MediaLibrary } from "./media.ts";
import { Workspaces } from "./workspaces.ts";

export * from "./entries.ts";
export * from "./media.ts";
export * from "./ports.ts";
export * from "./workspaces.ts";

export const CoreLive = Layer.mergeAll(Entries.layer, MediaLibrary.layer).pipe(
  Layer.provideMerge(Workspaces.layer),
);
