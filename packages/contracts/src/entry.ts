import { Schema } from "effect";
import { RelativePath } from "./ids.ts";

export const EntryKind = Schema.Literals(["file", "directory", "symlink", "other"]);
export type EntryKind = typeof EntryKind.Type;

export const Entry = Schema.Struct({
  name: Schema.String,
  path: RelativePath,
  kind: EntryKind,
  size: Schema.Number,
  /** Epoch milliseconds. */
  modifiedAt: Schema.Number,
  hidden: Schema.Boolean,
});
export type Entry = typeof Entry.Type;
