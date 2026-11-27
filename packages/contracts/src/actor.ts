import { Schema } from "effect";

export const Actor = Schema.Union([
  Schema.TaggedStruct("User", {}),
  Schema.TaggedStruct("Agent", { id: Schema.String }),
]);
export type Actor = typeof Actor.Type;
