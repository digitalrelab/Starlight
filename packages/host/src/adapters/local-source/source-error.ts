import { type EntryId, LocalSource, SourceError } from "@starlight/contracts";

const REASONS: Readonly<Record<string, SourceError["reason"]>> = {
  ENOENT: "NotFound",
  EEXIST: "AlreadyExists",
  EACCES: "PermissionDenied",
  EPERM: "PermissionDenied",
};

export const sourceError = (id: EntryId, reason: SourceError["reason"], message: string) =>
  new SourceError({ entry: { source: LocalSource, id }, reason, message });

export const toSourceError = (id: EntryId) => (cause: unknown) => {
  const code = (cause as NodeJS.ErrnoException | undefined)?.code;
  return sourceError(
    id,
    (code && REASONS[code]) || "Unknown",
    cause instanceof Error ? cause.message : String(cause),
  );
};
