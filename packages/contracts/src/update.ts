import { Schema } from "effect";

export const UpdateStatus = Schema.Literals(["available", "downloading", "downloaded"]);
export type UpdateStatus = typeof UpdateStatus.Type;

export const UpdateFailure = Schema.Literals(["download", "install"]);
export type UpdateFailure = typeof UpdateFailure.Type;

export const Update = Schema.Struct({
  version: Schema.String,
  releaseNotes: Schema.String,
  status: UpdateStatus,
  progress: Schema.Number,
  failure: Schema.NullOr(UpdateFailure),
});
export type Update = typeof Update.Type;

export const UpdaterState = Schema.Struct({
  version: Schema.String,
  enabled: Schema.Boolean,
  checking: Schema.Boolean,
  checkedAt: Schema.NullOr(Schema.Number),
  checkFailed: Schema.Boolean,
  update: Schema.NullOr(Update),
});
export type UpdaterState = typeof UpdaterState.Type;
