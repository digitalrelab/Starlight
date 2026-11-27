import { Schema } from "effect";

export const WorkspaceId = Schema.String.pipe(Schema.brand("WorkspaceId"));
export type WorkspaceId = typeof WorkspaceId.Type;

export const SourceId = Schema.String.pipe(Schema.brand("SourceId"));
export type SourceId = typeof SourceId.Type;

export const EntryId = Schema.String.pipe(Schema.brand("EntryId"));
export type EntryId = typeof EntryId.Type;

export const EntryRef = Schema.Struct({ source: SourceId, id: EntryId });
export type EntryRef = typeof EntryRef.Type;

export const LocalSource = SourceId.make("local");
