import { type Entry, type EntryRef, entryKey, type Media } from "@starlight/client";
import { Card } from "@starlight/ui";
import { useQuery } from "@tanstack/react-query";
import { previewUrl } from "#shared/previews.ts";
import { Inspector } from "#renderer/features/inspector/inspector.tsx";
import { KindIcon, itemKindOf } from "#renderer/features/files/kind-icon.tsx";
import { useStarlight } from "#renderer/lib/context.ts";
import { placeholderUrl } from "#renderer/lib/placeholder.ts";
import { useSettled } from "./use-settled.ts";

const STILL_MAX_HEIGHT = 420;

interface StillProps {
  readonly entry: Entry;
  readonly media: Media | undefined;
  readonly width: number;
  readonly onOpen: () => void;
}

const Still = ({ entry, media, width, onOpen }: StillProps) => (
  <button
    type="button"
    aria-label={`Open ${entry.name}`}
    onClick={onOpen}
    className="grid aspect-4/3 w-full shrink-0 cursor-zoom-in place-items-center self-center overflow-hidden rounded-md bg-surface-sunken bg-cover bg-center focus-ring"
    style={
      media && {
        aspectRatio: `${media.width} / ${media.height}`,
        width: `min(100%, ${(STILL_MAX_HEIGHT * media.width) / media.height}px)`,
        backgroundImage: media.placeholder ? `url(${placeholderUrl(media.placeholder)})` : undefined,
      }
    }
  >
    {media ? (
      <img
        src={previewUrl(media.token, width * window.devicePixelRatio)}
        alt=""
        decoding="async"
        draggable={false}
        className="size-full object-contain"
      />
    ) : (
      <KindIcon kind={itemKindOf(entry)} className="size-10" />
    )}
  </button>
);

interface Props {
  readonly projectId: string;
  readonly elementId: string;
  readonly width: number;
  readonly directory: EntryRef;
  readonly entry: Entry;
  readonly defers: boolean;
  readonly onOpen: () => void;
}

export const PreviewColumn = ({ projectId, elementId, width, directory, entry, defers, onOpen }: Props) => {
  const { queries } = useStarlight();
  const key = entryKey(entry.ref);
  const { data: media } = useQuery({
    ...queries.media(projectId, directory),
    select: (list) => list.find((item) => entryKey(item.ref) === key),
  });
  const settled = useSettled(defers);
  return (
    <Card
      id={elementId}
      render={<aside />}
      aria-label={`Preview of ${entry.name}`}
      style={{ width }}
      className="flex h-full shrink-0 flex-col gap-3 overflow-hidden p-3"
    >
      <Still entry={entry} media={media} width={width} onOpen={onOpen} />
      <p className="flex min-w-0 items-center gap-2 px-1 font-medium">
        <KindIcon kind={itemKindOf(entry)} className="shrink-0" />
        <span className="truncate">{entry.name}</span>
      </p>
      {settled ? <Inspector projectId={projectId} directory={directory} entry={entry} /> : null}
    </Card>
  );
};
