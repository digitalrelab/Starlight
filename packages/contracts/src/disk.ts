import { Schema } from "effect";

export const DiskUsage = Schema.Struct({
  previews: Schema.Number,
  library: Schema.Number,
  other: Schema.Number,
});
export type DiskUsage = typeof DiskUsage.Type;
