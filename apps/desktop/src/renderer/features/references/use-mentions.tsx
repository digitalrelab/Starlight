import { BubbleChatIcon } from "@hugeicons-pro/core-stroke-rounded";
import { type ReferenceMatch, referenceOf, referenceUrl } from "@starlight/client";
import {
  type ActiveTrigger,
  insertLink,
  type MentionHosts,
  mentionChips,
  type TriggerSource,
  type TriggerStore,
  useTrigger,
} from "@starlight/markdown/editor";
import { Icon } from "@starlight/ui";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { EntryIcon } from "#renderer/features/files/entry-icon.tsx";
import { disambiguate } from "#renderer/features/files/disambiguate.ts";
import { itemKindOf } from "#renderer/features/files/kind-icon.tsx";
import { hiddenFiles } from "#renderer/features/settings/files.ts";
import { useStarlight } from "#renderer/lib/context.ts";
import { useStore } from "#renderer/lib/store.ts";
import { useDebouncedValue } from "#renderer/lib/use-debounced-value.ts";
import { renderReference } from "./reference-link.tsx";
import { type Resolution, TriggerMenu, type TriggerOption } from "./trigger-menu.tsx";

const SEARCH_DELAY_MS = 150;
const SEARCH_FRESH_MS = 10_000;

const GROUPS = ["Folders", "Files", "Chats"] as const;

interface MentionChoice extends TriggerOption {
  readonly group: (typeof GROUPS)[number];
  readonly url: string;
}

type EntryReference = Extract<ReferenceMatch, { readonly _tag: "Entry" }>;

const entryChoice = (match: EntryReference, detail: string | undefined): MentionChoice => {
  const url = referenceUrl({ _tag: "Entry", ref: match.ref });
  const { name, kind, token } = match.location;
  return {
    key: url,
    url,
    group: kind === "directory" ? "Folders" : "Files",
    leading: <EntryIcon kind={itemKindOf(match.location)} token={token} />,
    label: name,
    detail,
  };
};

const chatChoice = ({ id, title }: Extract<ReferenceMatch, { readonly _tag: "Chat" }>): MentionChoice => {
  const url = referenceUrl({ _tag: "Chat", id });
  return { key: url, url, group: "Chats", leading: <Icon icon={BubbleChatIcon} />, label: title };
};

const groupRank = (choice: MentionChoice) => GROUPS.indexOf(choice.group);

const choicesOf = (matches: ReadonlyArray<ReferenceMatch>) => {
  const entries = matches.filter((match): match is EntryReference => match._tag === "Entry");
  const detailOf = disambiguate(entries);
  const named = Map.groupBy(entries, ({ location }) => location.name);
  const collides = (match: EntryReference) => (named.get(match.location.name)?.length ?? 0) > 1;
  return [
    ...entries.map((match) => entryChoice(match, collides(match) ? detailOf(match) : undefined)),
    ...matches.flatMap((match) => (match._tag === "Chat" ? [chatChoice(match)] : [])),
  ].toSorted((a, b) => groupRank(a) - groupRank(b));
};

const useMentionChoices = (query: string): Resolution<MentionChoice> => {
  const { queries } = useStarlight();
  const term = useDebouncedValue(query, SEARCH_DELAY_MS);
  const includeHidden = useStore(hiddenFiles) === "show";
  const matches = useQuery({
    ...queries.referenceSearch(term, null, includeHidden),
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

const MentionPortals = ({ hosts }: { readonly hosts: MentionHosts }) =>
  useSyncExternalStore(hosts.subscribe, hosts.get).map(({ key, element, url, label }) =>
    createPortal(renderReference({ url, label }), element, key),
  );

export const useMentions = () => {
  const queryClient = useQueryClient();
  const { queries } = useStarlight();
  const [source] = useState<TriggerSource<MentionChoice>>(() => ({
    character: "@",
    apply: ({ label, url }, state, from, to) => insertLink(state, from, to, label, url),
    warm: () =>
      void queryClient.prefetchQuery({
        ...queries.referenceSearch("", null, hiddenFiles.get() === "show"),
        staleTime: SEARCH_FRESH_MS,
      }),
  }));
  const trigger = useTrigger(source);
  const [chips] = useState(() => mentionChips((url) => referenceOf(url) !== undefined));
  const [extension] = useState(() => [trigger.extension, chips.extension]);
  return {
    extension,
    element: (
      <>
        <MentionMenu store={trigger.store} />
        <MentionPortals hosts={chips.hosts} />
      </>
    ),
  };
};
