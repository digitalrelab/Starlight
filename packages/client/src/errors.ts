import { FileSystemError, NotADirectory } from "@starlight/contracts";

export const isMissingDirectory = (error: unknown) =>
  error instanceof NotADirectory || (error instanceof FileSystemError && error.reason === "NotFound");
