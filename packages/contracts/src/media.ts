import { Schema } from "effect";
import { EntryRef } from "./ids.ts";

export const ThumbnailToken = Schema.String.pipe(Schema.brand("ThumbnailToken"));
export type ThumbnailToken = typeof ThumbnailToken.Type;

export const Media = Schema.Struct({
  ref: EntryRef,
  width: Schema.Number,
  height: Schema.Number,
  thumbnail: ThumbnailToken,
});
export type Media = typeof Media.Type;
