import type { EntryLocation, EntryRef } from "@starlight/client";
import type { LinkOptions } from "@tanstack/react-router";
import { toDirectorySearch, toFileSearch } from "#renderer/features/browser/directory-search.ts";

export const entryLink = (
  ref: EntryRef,
  { kind, project, directory }: EntryLocation,
): LinkOptions | undefined =>
  project === null
    ? undefined
    : {
        to: "/p/$projectId",
        params: { projectId: project },
        search: kind === "directory" ? toDirectorySearch(ref) : toFileSearch(directory, ref),
      };
