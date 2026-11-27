import type { EntryMatch, EntryReferenceMatch } from "@starlight/client";
import type { CommandGroup, CommandItem } from "@starlight/ui";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { entryLink } from "#renderer/features/files/entry-link.ts";
import { disambiguate } from "#renderer/features/files/disambiguate.ts";
import { EntryIcon } from "#renderer/features/files/entry-icon.tsx";
import { itemKindOf } from "#renderer/features/files/kind-icon.tsx";
import { hiddenFiles } from "#renderer/features/settings/files.ts";
import { useStarlight } from "#renderer/lib/context.ts";
import { useStore } from "#renderer/lib/store.ts";

const MIN_QUERY = 2;

export const useEntryGroups = (text: string, projectId: string | null): ReadonlyArray<CommandGroup> => {
  const { queries } = useStarlight();
  const navigate = useNavigate();
  const searching = text.length >= MIN_QUERY;
  const { data = [] } = useQuery({
    ...queries.referenceSearch(text, projectId, useStore(hiddenFiles) === "show"),
    enabled: searching,
    placeholderData: keepPreviousData,
    select: (matches) => matches.filter((match): match is EntryReferenceMatch => match._tag === "Entry"),
  });
  if (!searching) return [];
  const detailOf = disambiguate(data);
  const itemOf = (match: EntryMatch): CommandItem => ({
    key: JSON.stringify(match.ref),
    label: match.location.name,
    detail: detailOf(match),
    leading: <EntryIcon kind={itemKindOf(match.location)} token={match.location.token} />,
    run: () => {
      const link = entryLink(match.ref, match.location);
      if (link) void navigate(link);
    },
  });
  const folders = data.filter(({ location }) => location.kind === "directory");
  const files = data.filter(({ location }) => location.kind !== "directory");
  return [
    { label: "Folders", items: folders.map(itemOf) },
    { label: "Files", items: files.map(itemOf) },
  ];
};
