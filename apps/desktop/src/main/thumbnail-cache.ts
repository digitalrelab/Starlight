import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, utimes, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { listFiles } from "./list-files.ts";

type Bytes = Uint8Array<ArrayBuffer>;

const store = async (path: string, bytes: Bytes) => {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}`;
  await writeFile(temporary, bytes);
  await rename(temporary, path);
};

export const createThumbnailCache = (directory: string, limitBytes: number) => {
  const pending = new Map<string, Promise<Bytes | null>>();

  const pathOf = (identity: string) => {
    const hash = createHash("sha256").update(identity).digest("hex");
    return join(directory, hash.slice(0, 2), hash.slice(2));
  };

  const read = async (path: string): Promise<Bytes | null> => {
    try {
      const bytes = await readFile(path);
      const now = new Date();
      void utimes(path, now, now).catch(() => undefined);
      return bytes;
    } catch {
      return null;
    }
  };

  const produce = async (path: string, create: () => Promise<Bytes | null>) => {
    const cached = await read(path);
    if (cached) return cached;
    const created = await create();
    if (created) await store(path, created).catch(() => undefined);
    return created;
  };

  return {
    resolve: (identity: string, create: () => Promise<Bytes | null>) => {
      const path = pathOf(identity);
      const inflight = pending.get(path);
      if (inflight) return inflight;
      const task = produce(path, create).finally(() => pending.delete(path));
      pending.set(path, task);
      return task;
    },
    prune: async () => {
      let total = 0;
      const evicted = (await listFiles(directory))
        .sort((a, b) => b.modifiedAt - a.modifiedAt)
        .filter((file) => (total += file.size) > limitBytes);
      await Promise.allSettled(evicted.map((file) => rm(file.path, { force: true })));
    },
    clear: () => rm(directory, { recursive: true, force: true }),
  };
};

export type ThumbnailCache = ReturnType<typeof createThumbnailCache>;
