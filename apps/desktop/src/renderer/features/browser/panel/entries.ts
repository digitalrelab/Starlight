import type { Entry, EntryRef } from "@starlight/client";
import { useQuery } from "@tanstack/react-query";
import { hiddenFiles, visibleEntries } from "#renderer/features/settings/files.ts";
import { useStarlight } from "#renderer/lib/context.ts";
import { useStore } from "#renderer/lib/store.ts";

export const useColumnEntries = (projectId: string, directory: EntryRef | null, enabled = true) => {
  const { queries } = useStarlight();
  const showHidden = useStore(hiddenFiles) === "show";
  const { data, isError } = useQuery({ ...queries.entries(projectId, directory), enabled });
  return { entries: data && visibleEntries(data, showHidden), isError };
};

export const useCachedEntries = (projectId: string) => {
  const { queries, queryClient } = useStarlight();
  return (directory: EntryRef | null): ReadonlyArray<Entry> | undefined => {
    const listing = queryClient.getQueryData(queries.entries(projectId, directory).queryKey);
    return listing && visibleEntries(listing, hiddenFiles.get() === "show");
  };
};
