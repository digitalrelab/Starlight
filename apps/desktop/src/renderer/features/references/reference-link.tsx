import { BubbleChatIcon } from "@hugeicons-pro/core-stroke-rounded";
import { type Chat, type EntryLocation, type EntryRef, fileKindOf, referenceOf } from "@starlight/client";
import type { RenderLink } from "@starlight/markdown";
import { cn, Icon } from "@starlight/ui";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { chatLink } from "#renderer/features/agent/chat-links.ts";
import { toDirectorySearch, toFileSearch } from "#renderer/features/browser/directory-search.ts";
import { KindIcon } from "#renderer/features/files/kind-icon.tsx";
import { useStarlight } from "#renderer/lib/context.ts";

const chip =
  "inline-flex items-baseline gap-1 rounded-md bg-neutral px-1.5 align-baseline text-default no-underline focus-ring";

const Unresolved = ({ title, children }: { readonly title: string; readonly children: ReactNode }) => (
  <span title={title} className={cn(chip, "bg-neutral-subtle text-subtlest")}>
    {children}
  </span>
);

const entryOpening = (ref: EntryRef, { kind, project, directory }: EntryLocation) =>
  project === null
    ? undefined
    : {
        to: "/p/$projectId" as const,
        params: { projectId: project },
        search: kind === "directory" ? toDirectorySearch(ref) : toFileSearch(directory, ref),
      };

const EntryChip = ({ entry, label }: { readonly entry: EntryRef; readonly label: ReactNode }) => {
  const { queries } = useStarlight();
  const { data: location, isError } = useQuery(queries.entryLocation(entry));
  const icon = (
    <KindIcon
      kind={location?.kind === "directory" ? "folder" : fileKindOf(location?.name ?? "")}
      size={14}
      className="self-center"
    />
  );
  if (isError)
    return (
      <Unresolved title="No longer exists">
        {icon}
        {label}
      </Unresolved>
    );
  const opening = location && entryOpening(entry, location);
  if (!opening)
    return (
      <Unresolved title={location ? "Not in a project" : "Loading"}>
        {icon}
        {label}
      </Unresolved>
    );
  return (
    <Link {...opening} className={cn(chip, "highlighted:bg-neutral-hovered")}>
      {icon}
      {label}
    </Link>
  );
};

const ChatChip = ({ chat, label }: { readonly chat: Chat["id"]; readonly label: ReactNode }) => {
  const { queries } = useStarlight();
  const { isError } = useQuery(queries.chat(chat));
  const icon = <Icon icon={BubbleChatIcon} size={14} className="self-center text-subtle" />;
  if (isError)
    return (
      <Unresolved title="No longer exists">
        {icon}
        {label}
      </Unresolved>
    );
  return (
    <Link {...chatLink({ id: chat })} className={cn(chip, "highlighted:bg-neutral-hovered")}>
      {icon}
      {label}
    </Link>
  );
};

export const renderReference: RenderLink = ({ url, label }) => {
  const reference = referenceOf(url);
  if (!reference) return undefined;
  return reference._tag === "Entry" ? (
    <EntryChip entry={reference.ref} label={label} />
  ) : (
    <ChatChip chat={reference.id} label={label} />
  );
};
