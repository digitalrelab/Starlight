import { Schema } from "effect";
import { EntryRef } from "./ids.ts";

export const FileToken = Schema.String.pipe(Schema.brand("FileToken"));
export type FileToken = typeof FileToken.Type;

export const Dimensions = Schema.Struct({
  width: Schema.Number,
  height: Schema.Number,
});
export type Dimensions = typeof Dimensions.Type;

export const Media = Schema.Struct({
  ...Dimensions.fields,
  ref: EntryRef,
  token: FileToken,
});
export type Media = typeof Media.Type;

export const FileSource = Schema.Struct({
  token: FileToken,
  dimensions: Schema.NullOr(Dimensions),
});
export type FileSource = typeof FileSource.Type;
