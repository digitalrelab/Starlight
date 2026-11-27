import { readdir, stat } from "node:fs/promises";
import { join, sep } from "node:path";

interface DiskFile {
  readonly path: string;
  readonly size: number;
  readonly modifiedAt: number;
}

const statFile = async (path: string): Promise<DiskFile | null> => {
  try {
    const { size, mtimeMs } = await stat(path);
    return { path, size, modifiedAt: mtimeMs };
  } catch {
    return null;
  }
};

export const listFiles = async (directory: string) => {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true }).catch(() => []);
  const files = await Promise.all(
    entries.filter((entry) => entry.isFile()).map((entry) => statFile(join(entry.parentPath, entry.name))),
  );
  return files.filter((file) => file !== null);
};

export const measure = async (directory: string, part: string) => {
  let totalBytes = 0;
  let partBytes = 0;
  for (const file of await listFiles(directory)) {
    totalBytes += file.size;
    if (file.path.startsWith(part + sep)) partBytes += file.size;
  }
  return { totalBytes, partBytes };
};
