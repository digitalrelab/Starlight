import { Schema } from "effect";
import { EntryRef, FileId } from "./ids.ts";

export const EntryKind = Schema.Literals(["file", "directory", "symlink", "other"]);
export type EntryKind = typeof EntryKind.Type;

export const Entry = Schema.Struct({
  ref: EntryRef,
  fileId: Schema.NullOr(FileId),
  name: Schema.String,
  kind: EntryKind,
  size: Schema.Number,
  modifiedAt: Schema.Number,
  hidden: Schema.Boolean,
});
export type Entry = typeof Entry.Type;

export const Crumb = Schema.Struct({ ref: EntryRef, name: Schema.String });
export type Crumb = typeof Crumb.Type;

export const Listing = Schema.Struct({ trail: Schema.Array(Crumb), entries: Schema.Array(Entry) });
export type Listing = typeof Listing.Type;

export const EntryChange = Schema.Union([
  Schema.TaggedStruct("Changed", { directories: Schema.Array(EntryRef) }),
  Schema.TaggedStruct("Resync", {}),
]);
export type EntryChange = typeof EntryChange.Type;
