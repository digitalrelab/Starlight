import { join, sep } from "node:path";
import type { DiskUsage } from "@starlight/contracts";
import { app } from "electron";
import { listFiles } from "./list-files.ts";

export const appData = () => {
  const root = app.getPath("userData");
  return { root, database: join(root, "starlight.db"), previews: join(root, "previews") };
};

export const measureAppData = async (): Promise<DiskUsage> => {
  const { root, database, previews } = appData();
  const usage = { previews: 0, library: 0, other: 0 };
  for (const { path, size } of await listFiles(root)) {
    if (path.startsWith(previews + sep)) usage.previews += size;
    else if (path.startsWith(database)) usage.library += size;
    else usage.other += size;
  }
  return usage;
};
