import type { Stats } from "node:fs";
import { lstat, readdir, realpath, stat } from "node:fs/promises";
import { join } from "node:path";
import { type EntryKind, FileSystemError } from "@starlight/contracts";
import { type DirectoryEntry, type FileStat, FileSystemPort } from "@starlight/core";
import { Effect, Layer } from "effect";

const toError = (path: string) => (cause: unknown) => {
  const code = (cause as NodeJS.ErrnoException | undefined)?.code;
  return new FileSystemError({
    path,
    reason:
      code === "ENOENT" ? "NotFound" : code === "EACCES" || code === "EPERM" ? "PermissionDenied" : "Unknown",
    message: cause instanceof Error ? cause.message : String(cause),
  });
};

const kindOf = (s: Stats): EntryKind =>
  s.isDirectory() ? "directory" : s.isFile() ? "file" : s.isSymbolicLink() ? "symlink" : "other";

const toFileStat = (s: Stats): FileStat => ({ kind: kindOf(s), size: s.size, modifiedAt: s.mtimeMs });

/** Entries that vanish or cannot be stat'd between `readdir` and `lstat` are skipped. */
const statEntry = (directory: string, name: string): Promise<DirectoryEntry | undefined> =>
  lstat(join(directory, name)).then(
    (s) => ({ name, ...toFileStat(s) }),
    () => undefined,
  );

export const NodeFileSystemLive = Layer.succeed(FileSystemPort)({
  realPath: (path) => Effect.tryPromise({ try: () => realpath(path), catch: toError(path) }),

  stat: (path) =>
    Effect.tryPromise({ try: () => stat(path), catch: toError(path) }).pipe(Effect.map(toFileStat)),

  readDirectory: (path) =>
    Effect.tryPromise({
      try: async () => {
        const names = await readdir(path);
        const entries = await Promise.all(names.map((name) => statEntry(path, name)));
        return entries.filter((entry) => entry !== undefined);
      },
      catch: toError(path),
    }),
});
