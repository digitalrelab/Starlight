import { BubbleChatIcon } from "@hugeicons-pro/core-stroke-rounded";
import { type EntryLocation, type EntryRef, referenceOf } from "@starlight/client";
import type { RenderLink } from "@starlight/markdown";
import { cn, Icon } from "@starlight/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, type LinkOptions } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { chatLink } from "#renderer/features/agent/chat-links.ts";
import { toDirectorySearch, toFileSearch } from "#renderer/features/browser/directory-search.ts";
import { itemKindOf, KindIcon } from "#renderer/features/files/kind-icon.tsx";
import { useStarlight } from "#renderer/lib/context.ts";

interface ChipProps {
  readonly icon: ReactNode;
  readonly label: ReactNode;
  readonly link?: LinkOptions | undefined;
  readonly unresolved?: string | undefined;
}

const Chip = ({ icon, label, link, unresolved }: ChipProps) => {
  const className = cn(
    "inline-flex items-baseline gap-1 rounded-md px-1.5 align-baseline no-underline focus-ring [&>svg]:self-center",
    unresolved ? "bg-neutral-subtle text-subtlest" : "bg-neutral text-default highlighted:bg-neutral-hovered",
  );
  return link && !unresolved ? (
    <Link {...link} className={className}>
      {icon}
      {label}
    </Link>
  ) : (
    <span title={unresolved} className={className}>
      {icon}
      {label}
    </span>
  );
};

const openingOf = (ref: EntryRef, { kind, project, directory }: EntryLocation): LinkOptions | undefined =>
  project === null
    ? undefined
    : {
        to: "/p/$projectId",
        params: { projectId: project },
        search: kind === "directory" ? toDirectorySearch(ref) : toFileSearch(directory, ref),
      };

const EntryChip = ({ entry, label }: { readonly entry: EntryRef; readonly label: ReactNode }) => {
  const { queries } = useStarlight();
  const { data: location, isError } = useQuery(queries.entryLocation(entry));
  return (
    <Chip
      icon={<KindIcon kind={location ? itemKindOf(location) : "other"} size={14} />}
      label={label}
      link={location && openingOf(entry, location)}
      unresolved={isError ? "No longer exists" : location?.project === null ? "Not in a project" : undefined}
    />
  );
};

export const renderReference: RenderLink = ({ url, label }) => {
  const reference = referenceOf(url);
  if (!reference) return undefined;
  return reference._tag === "Entry" ? (
    <EntryChip entry={reference.ref} label={label} />
  ) : (
    <Chip
      icon={<Icon icon={BubbleChatIcon} size={14} className="text-subtle" />}
      label={label}
      link={chatLink(reference)}
    />
  );
};
