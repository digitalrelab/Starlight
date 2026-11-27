import { Schema } from "effect";
import { prefixedId } from "./prefixed-id.ts";

export const ProjectId = Schema.String.pipe(Schema.brand("ProjectId"));
export type ProjectId = typeof ProjectId.Type;

export const SourceId = Schema.String.pipe(Schema.brand("SourceId"));
export type SourceId = typeof SourceId.Type;

export const EntryId = Schema.String.pipe(Schema.brand("EntryId"));
export type EntryId = typeof EntryId.Type;

export const FileId = prefixedId("fil", Schema.brand("FileId"));
export type FileId = typeof FileId.Type;

export const EntryRef = Schema.Struct({ source: SourceId, id: EntryId });
export type EntryRef = typeof EntryRef.Type;

export const LocalSource = SourceId.make("local");
