import { Schema } from "effect";
import { ChatId } from "./chat.ts";
import { EntryRef } from "./ids.ts";
import { EntryLocation } from "./reference.ts";

export const EntryMatch = Schema.Struct({
  ref: EntryRef,
  location: EntryLocation,
  folders: Schema.Array(Schema.String),
});
export type EntryMatch = typeof EntryMatch.Type;

export const ReferenceMatch = Schema.Union([
  Schema.TaggedStruct("Entry", EntryMatch.fields),
  Schema.TaggedStruct("Chat", { id: ChatId, title: Schema.String }),
]);
export type ReferenceMatch = typeof ReferenceMatch.Type;
export type EntryReferenceMatch = Extract<ReferenceMatch, { readonly _tag: "Entry" }>;
