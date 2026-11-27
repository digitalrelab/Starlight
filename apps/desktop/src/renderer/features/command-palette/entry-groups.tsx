import type { EntryMatch } from "@starlight/client";
import type { CommandGroup, CommandItem } from "@starlight/ui";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { previewUrl } from "#shared/previews.ts";
import { entryLink } from "#renderer/features/files/entry-link.ts";
import { type ItemKind, itemKindOf, KindIcon } from "#renderer/features/files/kind-icon.tsx";
import { hiddenFiles } from "#renderer/features/settings/files.ts";
import { useStarlight } from "#renderer/lib/context.ts";
import { useStore } from "#renderer/lib/store.ts";

const MIN_QUERY = 2;
const LEADING_SIZE = 20;
const PREVIEWED = new Set<ItemKind>(["image", "video"]);

const Leading = ({ match }: { readonly match: EntryMatch }) => {
  const kind = itemKindOf(match.location);
  const [failed, setFailed] = useState(false);
  return match.token && PREVIEWED.has(kind) && !failed ? (
    <img
      src={previewUrl(match.token, LEADING_SIZE * window.devicePixelRatio)}
      alt=""
      decoding="async"
      onError={() => setFailed(true)}
      className="size-5 rounded-sm object-cover"
    />
  ) : (
    <KindIcon kind={kind} />
  );
};

const trailOf = (match: EntryMatch, depth: number) => match.folders.slice(-depth).join(" / ");

const disambiguate = (matches: ReadonlyArray<EntryMatch>) => {
  const depths = new Map(matches.map((match) => [match, 1]));
  const depthOf = (match: EntryMatch) => depths.get(match) ?? 1;
  let ambiguous = true;
  while (ambiguous) {
    ambiguous = false;
    const alike = Map.groupBy(
      matches,
      (match) => `${match.location.name}\0${trailOf(match, depthOf(match))}`,
    );
    for (const group of alike.values()) {
      if (group.length < 2) continue;
      for (const match of group) {
        if (depthOf(match) >= match.folders.length) continue;
        depths.set(match, depthOf(match) + 1);
        ambiguous = true;
      }
    }
  }
  return (match: EntryMatch) => trailOf(match, depthOf(match));
};

export const useEntryGroups = (text: string, projectId: string | null): ReadonlyArray<CommandGroup> => {
  const { queries } = useStarlight();
  const navigate = useNavigate();
  const searching = text.length >= MIN_QUERY;
  const { data = [] } = useQuery({
    ...queries.entrySearch(text, projectId, useStore(hiddenFiles) === "show"),
    enabled: searching,
    placeholderData: keepPreviousData,
  });
  if (!searching) return [];
  const detailOf = disambiguate(data);
  const itemOf = (match: EntryMatch): CommandItem => ({
    key: JSON.stringify(match.ref),
    label: match.location.name,
    detail: detailOf(match),
    leading: <Leading match={match} />,
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
