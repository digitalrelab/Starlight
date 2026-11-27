import { Schema } from "effect";
import { EntryRef, FileId } from "./ids.ts";
import { Property } from "./property.ts";

export const FileToken = Schema.String.pipe(Schema.brand("FileToken"));
export type FileToken = typeof FileToken.Type;

export const FileVersion = Schema.String.pipe(Schema.brand("FileVersion"));
export type FileVersion = typeof FileVersion.Type;

export const Dimensions = Schema.Struct({
  width: Schema.Number,
  height: Schema.Number,
});
export type Dimensions = typeof Dimensions.Type;

export const Swatch = Schema.Struct({
  color: Schema.String,
  share: Schema.Number,
});
export type Swatch = typeof Swatch.Type;

export const Palette = Schema.Array(Swatch);
export type Palette = typeof Palette.Type;

export const MediaAppearance = Schema.Struct({
  placeholder: Schema.NullOr(Schema.String),
});
export type MediaAppearance = typeof MediaAppearance.Type;

export const Media = Schema.Struct({
  ...Dimensions.fields,
  ...MediaAppearance.fields,
  ref: EntryRef,
  fileId: FileId,
  token: FileToken,
});
export type Media = typeof Media.Type;

export const MediaUpdate = Schema.Struct({
  ...MediaAppearance.fields,
  ref: EntryRef,
});
export type MediaUpdate = typeof MediaUpdate.Type;

export const FileSource = Schema.Struct({
  token: FileToken,
  version: FileVersion,
  dimensions: Schema.NullOr(Dimensions),
});
export type FileSource = typeof FileSource.Type;

export const FileDetails = Schema.Struct({
  fileId: FileId,
  folderName: Schema.String,
  size: Schema.Number,
  createdAt: Schema.Number,
  modifiedAt: Schema.Number,
  mediaType: Schema.NullOr(Schema.String),
  dimensions: Schema.NullOr(Dimensions),
  palette: Palette,
  properties: Schema.Array(Property),
});
export type FileDetails = typeof FileDetails.Type;
