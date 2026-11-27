import { Schema } from "effect";
import { RelativePath } from "./ids.ts";

export const EntryKind = Schema.Literals(["file", "directory", "symlink", "other"]);
export type EntryKind = typeof EntryKind.Type;

export const Entry = Schema.Struct({
  name: Schema.String,
  path: RelativePath,
  kind: EntryKind,
  size: Schema.Number,
  modifiedAt: Schema.Number,
  hidden: Schema.Boolean,
});
export type Entry = typeof Entry.Type;

export const EntryChange = Schema.Union([
  Schema.TaggedStruct("Changed", { paths: Schema.Array(RelativePath) }),
  Schema.TaggedStruct("Resync", {}),
]);
export type EntryChange = typeof EntryChange.Type;
