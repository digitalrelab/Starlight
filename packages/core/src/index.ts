import { Layer } from "effect";
import { Entries } from "./entries.ts";
import { Settings } from "./settings.ts";
import { Workspaces } from "./workspaces.ts";

export * from "./entries.ts";
export * from "./ports.ts";
export * from "./settings.ts";
export * from "./workspaces.ts";

export const CoreLive = Layer.mergeAll(Entries.layer, Settings.layer).pipe(
  Layer.provideMerge(Workspaces.layer),
);
