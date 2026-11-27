import { BubbleChatIcon } from "@hugeicons-pro/core-stroke-rounded";
import { type Project, type ReferenceMatch, referenceOf, referenceUrl } from "@starlight/client";
import type { Mention, Mentions } from "@starlight/markdown/editor";
import { Icon } from "@starlight/ui";
import { useQueryClient } from "@tanstack/react-query";
import { createElement, type ReactElement, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { itemKindOf, KindIcon } from "#renderer/features/files/kind-icon.tsx";
import { useStarlight } from "#renderer/lib/context.ts";

const SEARCH_FRESH_MS = 10_000;

const nodeOf = (element: ReactElement) => {
  const node = document.createElement("span");
  node.className = "md-mention-icon";
  node.innerHTML = renderToStaticMarkup(element);
  return node;
};

const mentionOf = (match: ReferenceMatch, projects: ReadonlyArray<Project>): Mention =>
  match._tag === "Entry"
    ? {
        label: match.name,
        url: referenceUrl({ _tag: "Entry", ref: match.ref }),
        detail: projects.find(({ id }) => id === match.project)?.name,
        icon: nodeOf(createElement(KindIcon, { kind: itemKindOf(match), size: 16 })),
      }
    : {
        label: match.title,
        url: referenceUrl({ _tag: "Chat", id: match.id }),
        detail: "Chat",
        icon: nodeOf(createElement(Icon, { icon: BubbleChatIcon, size: 16, className: "text-subtle" })),
      };

export const useMentions = () => {
  const queryClient = useQueryClient();
  const { queries } = useStarlight();
  const [mentions] = useState<Mentions>(() => ({
    recognizes: (url) => referenceOf(url) !== undefined,
    search: async (query) => {
      const [matches, projects] = await Promise.all([
        queryClient.fetchQuery({ ...queries.referenceSearch(query), staleTime: SEARCH_FRESH_MS }),
        queryClient.ensureQueryData(queries.projects()),
      ]);
      return matches.map((match) => mentionOf(match, projects));
    },
  }));
  return mentions;
};
