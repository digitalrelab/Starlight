import { BubbleChatIcon } from "@hugeicons-pro/core-stroke-rounded";
import { type EntryLocation, type EntryRef, referenceOf } from "@starlight/client";
import type { RenderLink } from "@starlight/markdown";
import { cn, Icon } from "@starlight/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, type LinkOptions } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { previewUrl } from "#shared/previews.ts";
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

const openingOf = (ref: EntryRef, { kind, project, directory }: EntryLocation): LinkOptions | undefined =>
  project === null
    ? undefined
    : {
        to: "/p/$projectId",
        params: { projectId: project },
        search: kind === "directory" ? toDirectorySearch(ref) : toFileSearch(directory, ref),
      };

const ICON_SIZE = 14;

interface Settled {
  readonly preview: string;
  readonly loaded: boolean;
}

const EntryIcon = ({ location }: { readonly location: EntryLocation | undefined }) => {
  const [settled, setSettled] = useState<Settled | null>(null);
  const preview = location?.preview ?? null;
  const loaded = settled?.preview === preview ? settled.loaded : undefined;
  return (
    <>
      {loaded ? null : <KindIcon kind={location ? itemKindOf(location) : "other"} size={ICON_SIZE} />}
      {preview === null || loaded === false ? null : (
        <img
          alt=""
          src={previewUrl(preview, ICON_SIZE * window.devicePixelRatio)}
          width={ICON_SIZE}
          height={ICON_SIZE}
          hidden={!loaded}
          onLoad={() => setSettled({ preview, loaded: true })}
          onError={() => setSettled({ preview, loaded: false })}
          className="shrink-0 rounded-xs object-cover"
        />
      )}
    </>
  );
};

const EntryChip = ({ entry, label }: { readonly entry: EntryRef; readonly label: ReactNode }) => {
  const { queries } = useStarlight();
  const { data: location, isError } = useQuery(queries.entryLocation(entry));
  return (
    <Chip
      icon={<EntryIcon location={location} />}
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
      icon={<Icon icon={BubbleChatIcon} size={ICON_SIZE} className="text-subtle" />}
      label={label}
      link={chatLink(reference)}
    />
  );
};
