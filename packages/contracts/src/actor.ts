import { Schema } from "effect";

/** Who issued a command. Every connection to the host is bound to one actor. */
export const Actor = Schema.Union([
  Schema.TaggedStruct("User", {}),
  Schema.TaggedStruct("Agent", { id: Schema.String }),
]);
export type Actor = typeof Actor.Type;
