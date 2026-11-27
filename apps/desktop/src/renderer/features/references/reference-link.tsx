import { BubbleChatIcon } from "@hugeicons-pro/core-stroke-rounded";
import { type EntryRef, referenceOf } from "@starlight/client";
import type { RenderLink } from "@starlight/markdown";
import { cn, Icon } from "@starlight/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, type LinkOptions } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { chatLink } from "#renderer/features/agent/chat-links.ts";
import { EntryIcon } from "#renderer/features/files/entry-icon.tsx";
import { entryLink } from "#renderer/features/files/entry-link.ts";
import { itemKindOf } from "#renderer/features/files/kind-icon.tsx";
import { useStarlight } from "#renderer/lib/context.ts";

interface ChipProps {
  readonly icon: ReactNode;
  readonly label: ReactNode;
  readonly link?: LinkOptions | undefined;
  readonly unresolved?: string | undefined;
}

const Chip = ({ icon, label, link, unresolved }: ChipProps) => {
  const className = cn(
    "inline-flex items-baseline gap-1 rounded-md px-1.5 align-baseline no-underline focus-ring [&>:is(svg,img)]:self-center",
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

const ICON_SIZE = 14;

const EntryChip = ({ entry, label }: { readonly entry: EntryRef; readonly label: ReactNode }) => {
  const { queries } = useStarlight();
  const { data: location, isError } = useQuery(queries.entryLocation(entry));
  return (
    <Chip
      icon={
        <EntryIcon
          kind={location ? itemKindOf(location) : "other"}
          token={location?.token ?? null}
          size={ICON_SIZE}
        />
      }
      label={label}
      link={location && entryLink(entry, location)}
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
      icon={<Icon icon={BubbleChatIcon} size={ICON_SIZE} className="text-subtle" />}
      label={label}
      link={chatLink(reference)}
    />
  );
};
