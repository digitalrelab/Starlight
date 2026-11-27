import { Schema } from "effect";

export const Update = Schema.Struct({
  version: Schema.String,
  releaseNotes: Schema.String,
});
export type Update = typeof Update.Type;
