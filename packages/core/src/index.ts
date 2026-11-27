import { Layer } from "effect";
import { Entries } from "./entries.ts";
import { Workspaces } from "./workspaces.ts";

export * from "./entries.ts";
export * from "./ports.ts";
export * from "./workspaces.ts";

export const CoreLive = Entries.layer.pipe(Layer.provideMerge(Workspaces.layer));
