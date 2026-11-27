import { type EntryId, LocalSource, SourceError } from "@starlight/contracts";

export const toSourceError = (id: EntryId) => (cause: unknown) => {
  const code = (cause as NodeJS.ErrnoException | undefined)?.code;
  return new SourceError({
    entry: { source: LocalSource, id },
    reason:
      code === "ENOENT" ? "NotFound" : code === "EACCES" || code === "EPERM" ? "PermissionDenied" : "Unknown",
    message: cause instanceof Error ? cause.message : String(cause),
  });
};
