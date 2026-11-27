import { BubbleChatIcon } from "@hugeicons-pro/core-stroke-rounded";
import { type ReferenceMatch, referenceOf, referenceUrl } from "@starlight/client";
import {
  type ActiveTrigger,
  insertLink,
  mentionChips,
  type TriggerSource,
  type TriggerStore,
  useTrigger,
} from "@starlight/markdown/editor";
import { Icon } from "@starlight/ui";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useSyncExternalStore } from "react";
import { itemKindOf, KindIcon } from "#renderer/features/files/kind-icon.tsx";
import { useStarlight } from "#renderer/lib/context.ts";
import { useDebouncedValue } from "#renderer/lib/use-debounced-value.ts";
import { type Resolution, TriggerMenu, type TriggerOption } from "./trigger-menu.tsx";

const SEARCH_DELAY_MS = 150;
const SEARCH_FRESH_MS = 10_000;

const GROUPS = ["Folders", "Files", "Chats"] as const;

interface MentionChoice extends TriggerOption {
  readonly group: (typeof GROUPS)[number];
  readonly url: string;
  readonly parent?: string;
}

const choiceOf = (match: ReferenceMatch): MentionChoice => {
  if (match._tag === "Chat") {
    const url = referenceUrl({ _tag: "Chat", id: match.id });
    return { key: url, url, group: "Chats", leading: <Icon icon={BubbleChatIcon} />, label: match.title };
  }
  const url = referenceUrl({ _tag: "Entry", ref: match.ref });
  return {
    key: url,
    url,
    group: match.kind === "directory" ? "Folders" : "Files",
    leading: <KindIcon kind={itemKindOf(match)} size={16} />,
    label: match.name,
    parent: match.parent,
  };
};

const groupRank = (choice: MentionChoice) => GROUPS.indexOf(choice.group);

const choicesOf = (matches: ReadonlyArray<ReferenceMatch>) => {
  const choices = matches.map(choiceOf).toSorted((a, b) => groupRank(a) - groupRank(b));
  const counts = Map.groupBy(choices, ({ label }) => label);
  return choices.map((choice) =>
    (counts.get(choice.label)?.length ?? 0) > 1 ? { ...choice, detail: choice.parent } : choice,
  );
};

const useMentionChoices = (query: string): Resolution<MentionChoice> => {
  const { queries } = useStarlight();
  const term = useDebouncedValue(query, SEARCH_DELAY_MS);
  const matches = useQuery({
    ...queries.referenceSearch(term),
    staleTime: SEARCH_FRESH_MS,
    placeholderData: keepPreviousData,
  });
  return {
    choices: choicesOf(matches.data ?? []),
    settled: term === query && !matches.isPending && !matches.isPlaceholderData,
  };
};

const OpenMentionMenu = ({ active }: { readonly active: ActiveTrigger<MentionChoice> }) => (
  <TriggerMenu active={active} resolution={useMentionChoices(active.query.trim())} />
);

const MentionMenu = ({ store }: { readonly store: TriggerStore<MentionChoice> }) => {
  const active = useSyncExternalStore(store.subscribe, store.get);
  return active && <OpenMentionMenu active={active} />;
};

export const useMentions = () => {
  const queryClient = useQueryClient();
  const { queries } = useStarlight();
  const [source] = useState<TriggerSource<MentionChoice>>(() => ({
    character: "@",
    apply: ({ label, url }, state, from, to) => insertLink(state, from, to, label, url),
    warm: () =>
      void queryClient.prefetchQuery({ ...queries.referenceSearch(""), staleTime: SEARCH_FRESH_MS }),
  }));
  const trigger = useTrigger(source);
  const [extension] = useState(() => [
    trigger.extension,
    mentionChips((url) => referenceOf(url) !== undefined),
  ]);
  return { extension, menu: <MentionMenu store={trigger.store} /> };
};
