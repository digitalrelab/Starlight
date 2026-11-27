import { Schema } from "effect";

export const IgnorePattern = Schema.String.check(Schema.isPattern(/^[^/\s](?:[^/]*[^/\s])?$/));
export type IgnorePattern = typeof IgnorePattern.Type;

export const isIgnorePattern = Schema.is(IgnorePattern);

export const DEFAULT_IGNORE_PATTERNS: ReadonlyArray<IgnorePattern> = [
  "*.photoslibrary",
  "*.photolibrary",
  "*.migratedphotolibrary",
  "*.aplibrary",
  "*.cocatalog",
  "*.lrdata",
  "*.musiclibrary",
  "*.tvlibrary",
  "*.imovielibrary",
  "*.fcpbundle",
  "*.logicx",
  "*.band",
  "*.app",
  "Media Cache",
  "Media Cache Files",
  "Adobe Premiere Pro Auto-Save",
  "Adobe Premiere Pro Video Previews",
  "Adobe Premiere Pro Audio Previews",
  "Adobe After Effects Auto-Save",
  "CacheClip",
  ".DS_Store",
  ".Trashes",
  ".Spotlight-V100",
  ".fseventsd",
  ".DocumentRevisions-V100",
  ".TemporaryItems",
  "$RECYCLE.BIN",
  "System Volume Information",
  ".git",
  ".svn",
  ".hg",
  "node_modules",
  ".venv",
  "__pycache__",
];
