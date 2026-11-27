import { Schema } from "effect";
import { WorkspaceId } from "./ids.ts";

export const Workspace = Schema.Struct({
  id: WorkspaceId,
  name: Schema.String,
  rootPath: Schema.String,
  openedAt: Schema.Number,
});
export type Workspace = typeof Workspace.Type;
