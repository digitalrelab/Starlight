import type { Stats } from "node:fs";
import { lstat, open, readdir, realpath, stat } from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { subscribe } from "@parcel/watcher";
import { EntryId, type EntryKind, type SourceError } from "@starlight/contracts";
import type { SourceChange, SourceCrumb, SourceDriver, SourceEntry } from "@starlight/core";
import { Effect, Queue, Stream } from "effect";
import type { Imaging } from "#adapters/imaging.ts";
import { dimensionsExtractor } from "./dimensions/index.ts";
import { toSourceError } from "./source-error.ts";

const resync: SourceChange = { _tag: "Resync" };

const kindOf = (s: Stats): EntryKind =>
  s.isDirectory() ? "directory" : s.isFile() ? "file" : s.isSymbolicLink() ? "symlink" : "other";

const toEntry = (path: string, s: Stats): SourceEntry => {
  const name = basename(path) || path;
  return {
    id: EntryId.make(path),
    name,
    kind: kindOf(s),
    size: s.size,
    modifiedAt: s.mtimeMs,
    hidden: name.startsWith("."),
  };
};

const isWithin = (root: string, candidate: string) => {
  const base = resolve(root);
  const target = resolve(candidate);
  return target === base || target.startsWith(base.endsWith(sep) ? base : base + sep);
};

const trail = (root: string, id: string): ReadonlyArray<SourceCrumb> => {
  let path = root;
  return relative(root, id)
    .split(sep)
    .filter((segment) => segment !== "")
    .map((name) => {
      path = join(path, name);
      return { id: EntryId.make(path), name };
    });
};

const writeInPlace = async (path: string, content: Uint8Array) => {
  const handle = await open(path, "r+");
  try {
    await handle.writeFile(content);
    await handle.truncate(content.byteLength);
    await handle.sync();
    return await handle.stat();
  } finally {
    await handle.close();
  }
};

const staleDirectories = (paths: ReadonlyArray<string>) =>
  [...new Set(paths.flatMap((path) => [dirname(path), path]))].map((path) => EntryId.make(path));

const watch = (root: EntryId) =>
  Stream.callback<SourceChange, SourceError>((queue) =>
    Effect.acquireRelease(
      Effect.tryPromise({
        try: () =>
          subscribe(root, (error, events) => {
            Queue.offerUnsafe(
              queue,
              error
                ? resync
                : { _tag: "Changed", directories: staleDirectories(events.map((event) => event.path)) },
            );
          }),
        catch: toSourceError(root),
      }),
      (subscription) => Effect.ignore(Effect.tryPromise(() => subscription.unsubscribe())),
    ).pipe(Effect.andThen(Queue.offer(queue, resync))),
  );

export const makeLocalSource = (imaging: Imaging["Service"]): SourceDriver => {
  return {
    canonicalize: (id) =>
      Effect.tryPromise({ try: () => realpath(id), catch: toSourceError(id) }).pipe(
        Effect.map((path) => EntryId.make(path)),
      ),
    contains: isWithin,
    parent: (id) => EntryId.make(dirname(id)),
    trail,
    stat: (id) =>
      Effect.tryPromise({ try: () => stat(id), catch: toSourceError(id) }).pipe(
        Effect.map((s) => toEntry(id, s)),
      ),
    list: (id) =>
      Effect.tryPromise({
        try: async () => {
          const names = await readdir(id);
          const entries = await Promise.all(
            names.map((name) => {
              const path = join(id, name);
              return lstat(path).then(
                (s) => toEntry(path, s),
                () => undefined,
              );
            }),
          );
          return entries.filter((entry) => entry !== undefined);
        },
        catch: toSourceError(id),
      }),
    write: (id, content) =>
      Effect.tryPromise({ try: () => writeInPlace(id, content), catch: toSourceError(id) }).pipe(
        Effect.map((s) => toEntry(id, s)),
      ),
    watch,
    extractors: { dimensions: dimensionsExtractor },
    sample: (entry) => imaging.sample(entry.id),
  };
};
