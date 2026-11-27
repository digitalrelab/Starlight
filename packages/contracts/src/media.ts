import { Schema } from "effect";
import { RelativePath } from "./ids.ts";

export const ThumbnailToken = Schema.String.pipe(Schema.brand("ThumbnailToken"));
export type ThumbnailToken = typeof ThumbnailToken.Type;

export const Media = Schema.Struct({
  path: RelativePath,
  width: Schema.Number,
  height: Schema.Number,
  thumbnail: ThumbnailToken,
});
export type Media = typeof Media.Type;
