import { Schema } from "effect";
import { EntryRef } from "./ids.ts";
import { FileToken } from "./media.ts";
import { EntryLocation } from "./reference.ts";

export const EntryMatch = Schema.Struct({
  ref: EntryRef,
  location: EntryLocation,
  folders: Schema.Array(Schema.String),
  token: Schema.NullOr(FileToken),
});
export type EntryMatch = typeof EntryMatch.Type;
