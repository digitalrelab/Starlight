import { Schema } from "effect";

export const IgnorePattern = Schema.String.check(Schema.isPattern(/^[^/\s](?:[^/]*[^/\s])?$/));
export type IgnorePattern = typeof IgnorePattern.Type;

export const isIgnorePattern = Schema.is(IgnorePattern);

export const DEFAULT_IGNORE_PATTERNS: ReadonlyArray<IgnorePattern> = [
  ".git",
  ".hg",
  ".svn",
  "node_modules",
  "bower_components",
  "Pods",
  ".venv",
  "venv",
  "__pycache__",
  ".gradle",
  "DerivedData",
  ".next",
  ".turbo",
  "*.app",
  "*.photoslibrary",
  "*.fcpbundle",
  "*.logicx",
];
