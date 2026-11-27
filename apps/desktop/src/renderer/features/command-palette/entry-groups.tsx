import type { EntryMatch } from "@starlight/client";
import type { CommandGroup, CommandItem } from "@starlight/ui";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
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
  return match.token && PREVIEWED.has(kind) ? (
    <img
      src={previewUrl(match.token, LEADING_SIZE * window.devicePixelRatio)}
      alt=""
      decoding="async"
      className="size-5 rounded-sm object-cover"
    />
  ) : (
    <KindIcon kind={kind} />
  );
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
  const itemOf = (match: EntryMatch): CommandItem => ({
    key: JSON.stringify(match.ref),
    label: match.location.name,
    detail: match.folders.join(" / "),
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
