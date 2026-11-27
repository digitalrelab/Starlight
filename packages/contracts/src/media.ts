import { Schema } from "effect";
import { FileToken, RelativePath } from "./ids.ts";

export const Dimensions = Schema.Struct({
  width: Schema.Number,
  height: Schema.Number,
});
export type Dimensions = typeof Dimensions.Type;

export const Media = Schema.Struct({
  ...Dimensions.fields,
  path: RelativePath,
  token: FileToken,
});
export type Media = typeof Media.Type;

export const FileSource = Schema.Struct({
  token: FileToken,
  dimensions: Schema.NullOr(Dimensions),
});
export type FileSource = typeof FileSource.Type;
