import { FileSystemError } from "@starlight/contracts";

export const toFileSystemError = (path: string) => (cause: unknown) => {
  const code = (cause as NodeJS.ErrnoException | undefined)?.code;
  return new FileSystemError({
    path,
    reason:
      code === "ENOENT" ? "NotFound" : code === "EACCES" || code === "EPERM" ? "PermissionDenied" : "Unknown",
    message: cause instanceof Error ? cause.message : String(cause),
  });
};
