import { type EntryId, LocalSource, SourceError } from "@starlight/contracts";

const REASONS: Readonly<Record<string, SourceError["reason"]>> = {
  ENOENT: "NotFound",
  EEXIST: "AlreadyExists",
  EACCES: "PermissionDenied",
  EPERM: "PermissionDenied",
};

export const toSourceError = (id: EntryId) => (cause: unknown) => {
  const code = (cause as NodeJS.ErrnoException | undefined)?.code;
  return new SourceError({
    entry: { source: LocalSource, id },
    reason: (code && REASONS[code]) || "Unknown",
    message: cause instanceof Error ? cause.message : String(cause),
  });
};
