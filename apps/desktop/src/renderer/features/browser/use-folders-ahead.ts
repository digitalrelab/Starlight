import { type Entry, type EntryRef, entryKey } from "@starlight/client";
import { useEffect } from "react";
import { createWorkQueue, Priority } from "#renderer/lib/work-queue.ts";

const CONCURRENCY = 1;

const folders = createWorkQueue(CONCURRENCY);

export const useFoldersAhead = (
  scope: string,
  entries: ReadonlyArray<Entry>,
  preload: (folder: EntryRef) => Promise<unknown>,
) =>
  useEffect(
    () =>
      folders.requestAll(
        entries
          .filter((entry) => entry.kind === "directory")
          .map((entry) => ({
            key: `${scope}:${entryKey(entry.ref)}`,
            task: () => preload(entry.ref).then(() => true),
          })),
        Priority.background,
      ),
    [scope, entries, preload],
  );
