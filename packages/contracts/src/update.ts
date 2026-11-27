import { Schema } from "effect";

export const UpdateStatus = Schema.Literals(["available", "downloading", "downloaded"]);
export type UpdateStatus = typeof UpdateStatus.Type;

export const Update = Schema.Struct({
  version: Schema.String,
  releaseNotes: Schema.String,
  status: UpdateStatus,
  progress: Schema.Number,
});
export type Update = typeof Update.Type;
