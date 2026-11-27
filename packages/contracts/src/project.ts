import { Schema } from "effect";
import { EntryRef, ProjectId } from "./ids.ts";

export const Mount = Schema.Struct({ root: EntryRef, name: Schema.String });
export type Mount = typeof Mount.Type;

export const Project = Schema.Struct({
  id: ProjectId,
  name: Schema.String,
  createdAt: Schema.Number,
  mounts: Schema.Array(Mount),
});
export type Project = typeof Project.Type;
