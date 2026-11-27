import { Schema } from "effect";

export const WorkspaceId = Schema.String.pipe(Schema.brand("WorkspaceId"));
export type WorkspaceId = typeof WorkspaceId.Type;

/** POSIX path relative to a workspace root. `""` is the root itself. */
export const RelativePath = Schema.String;
export type RelativePath = typeof RelativePath.Type;
