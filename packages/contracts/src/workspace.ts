import { Schema } from "effect";
import { EntryRef, WorkspaceId } from "./ids.ts";

export const Mount = Schema.Struct({ root: EntryRef, name: Schema.String });
export type Mount = typeof Mount.Type;

export const Workspace = Schema.Struct({
  id: WorkspaceId,
  name: Schema.String,
  createdAt: Schema.Number,
  mounts: Schema.Array(Mount),
});
export type Workspace = typeof Workspace.Type;
