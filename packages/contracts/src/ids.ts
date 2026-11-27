import { Schema } from "effect";

export const WorkspaceId = Schema.String.pipe(Schema.brand("WorkspaceId"));
export type WorkspaceId = typeof WorkspaceId.Type;

export const RelativePath = Schema.String;
export type RelativePath = typeof RelativePath.Type;
