import type { Stats } from "node:fs";
import { lstat, readdir, realpath, stat } from "node:fs/promises";
import { join } from "node:path";
import type { EntryKind } from "@starlight/contracts";
import { type DirectoryEntry, type FileStat, FileSystemPort } from "@starlight/core";
import { Effect, Layer } from "effect";
import { toFileSystemError } from "./file-system-error.ts";

const kindOf = (s: Stats): EntryKind =>
  s.isDirectory() ? "directory" : s.isFile() ? "file" : s.isSymbolicLink() ? "symlink" : "other";

const toFileStat = (s: Stats): FileStat => ({ kind: kindOf(s), size: s.size, modifiedAt: s.mtimeMs });

const statEntry = (directory: string, name: string): Promise<DirectoryEntry | undefined> =>
  lstat(join(directory, name)).then(
    (s) => ({ name, ...toFileStat(s) }),
    () => undefined,
  );

export const NodeFileSystemLive = Layer.succeed(FileSystemPort)({
  realPath: (path) => Effect.tryPromise({ try: () => realpath(path), catch: toFileSystemError(path) }),

  stat: (path) =>
    Effect.tryPromise({ try: () => stat(path), catch: toFileSystemError(path) }).pipe(Effect.map(toFileStat)),

  readDirectory: (path) =>
    Effect.tryPromise({
      try: async () => {
        const names = await readdir(path);
        const entries = await Promise.all(names.map((name) => statEntry(path, name)));
        return entries.filter((entry) => entry !== undefined);
      },
      catch: toFileSystemError(path),
    }),
});
