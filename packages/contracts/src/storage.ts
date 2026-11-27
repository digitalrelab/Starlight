import { Schema } from "effect";

export const StorageUsage = Schema.Struct({
  totalBytes: Schema.Number,
  thumbnails: Schema.Struct({ bytes: Schema.Number, limitBytes: Schema.Number }),
});
export type StorageUsage = typeof StorageUsage.Type;
