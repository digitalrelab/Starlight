import { Image01Icon, Tick02Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { Entry, Media } from "@starlight/client";
import { formatDuration } from "@starlight/media-player";
import { cn, Icon } from "@starlight/ui";
import { memo, type ReactNode } from "react";
import { previewUrl } from "#shared/previews.ts";
import { placeholderUrl } from "#renderer/lib/placeholder.ts";
import { reveal } from "#renderer/lib/reveal.ts";
import { KindIcon, itemKindOf } from "#renderer/features/files/kind-icon.tsx";
import { type ItemHandlers, useItem } from "./events.ts";
import { usePreview } from "./use-preview.ts";

export const TILE_INSET = 4;
const CAPTION_HEIGHT = 28;
export const TILE_CHROME = { width: TILE_INSET * 2, height: TILE_INSET * 2 + CAPTION_HEIGHT };

export const tilePreviewUrl = (media: Media, width: number, height: number) =>
  previewUrl(
    media.token,
    Math.max(width - TILE_CHROME.width, height - TILE_CHROME.height) * window.devicePixelRatio,
  );

interface CellProps extends ItemHandlers {
  readonly index: number;
  readonly entry: Entry;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

const CHIP = "absolute flex items-center gap-2.5 rounded-md px-3";

export const DraftChip = ({
  top,
  left,
  width,
  height,
  children,
}: {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
  readonly children: ReactNode;
}) => (
  <div className={cn(CHIP, "bg-surface-sunken")} style={{ top, left, width, height }}>
    {children}
  </div>
);

export const FolderChip = memo(({ index, entry, left, width, height, ...handlers }: CellProps) => {
  const { selected, props } = useItem(index, entry, handlers);
  return (
    <div
      {...props}
      title={entry.name}
      className={cn(
        CHIP,
        "top-0 cursor-interactive",
        selected
          ? "bg-selected text-selected hover:bg-selected-hovered"
          : "bg-surface-sunken hover:bg-neutral-subtle-hovered",
        entry.hidden && "opacity-50",
      )}
      style={{ left, width, height }}
    >
      <KindIcon kind="folder" />
      <span className="truncate">{entry.name}</span>
    </div>
  );
});

interface TileProps extends CellProps {
  readonly media: Media | undefined;
  readonly visible: boolean;
}

export const Tile = memo(({ index, entry, media, left, width, height, visible, ...handlers }: TileProps) => {
  const kind = itemKindOf(entry);
  const { selected, props } = useItem(index, entry, handlers);
  return (
    <div
      {...props}
      title={entry.name}
      className={cn("group absolute top-0 flex cursor-interactive flex-col", entry.hidden && "opacity-50")}
      style={{ left, width, height, padding: TILE_INSET }}
    >
      <div
        className={cn(
          "group/preview relative min-h-0 flex-1 overflow-hidden rounded-md bg-surface-sunken outline-2 outline-offset-2",
          selected
            ? "outline-(--border-color-selected) group-hover:outline-(--border-color-selected-hovered)"
            : "outline-transparent group-hover:outline-(--text-color-subtlest)",
        )}
      >
        {media ? (
          <>
            <Preview
              url={tilePreviewUrl(media, width, height)}
              placeholder={media.placeholder}
              transparent={media.transparent}
              visible={visible}
            />
            {media.duration === null ? null : (
              <span className="absolute right-1.5 bottom-1.5 rounded-sm bg-black/60 px-1.5 text-xs text-white tabular-nums">
                {formatDuration(media.duration)}
              </span>
            )}
          </>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center [container-type:size]">
            <KindIcon kind={kind} className="size-[clamp(1.25rem,20cqmin,2.5rem)]" />
          </span>
        )}
        {selected && (
          <>
            <span className="absolute inset-0 bg-selected-overlay/60" />
            <span className="absolute top-1.5 left-1.5 grid size-5 place-items-center rounded-full bg-selected-bold text-inverse shadow-sm">
              <Icon icon={Tick02Icon} size={12} strokeWidth={2.5} />
            </span>
          </>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 px-1 text-sm" style={{ height: CAPTION_HEIGHT }}>
        <KindIcon kind={kind} size={14} />
        <span className="min-w-0 truncate">{entry.name}</span>
      </div>
    </div>
  );
});

interface PreviewProps {
  readonly url: string;
  readonly placeholder: string | null;
  readonly transparent: boolean;
  readonly visible: boolean;
}

const fade = "transition-opacity duration-150";
const underImage = cn(fade, "group-has-data-loaded/preview:opacity-0");

const Preview = ({ url, placeholder, transparent, visible }: PreviewProps) => {
  const { src, instant } = usePreview(url, visible);
  return (
    <>
      {placeholder ? (
        <div
          className={cn("absolute inset-0 bg-cover bg-center", underImage)}
          style={{ backgroundImage: `url(${placeholderUrl(placeholder)})` }}
        />
      ) : (
        <Icon
          icon={Image01Icon}
          size={24}
          className={cn("absolute top-1/2 left-1/2 -translate-1/2 text-subtlest", underImage)}
        />
      )}
      {src && (
        <img
          src={src}
          alt=""
          decoding="async"
          draggable={false}
          data-loaded={instant ? "" : undefined}
          onLoad={reveal}
          className={cn(
            fade,
            "relative size-full opacity-0 data-loaded:opacity-100",
            transparent ? "object-contain p-3" : "object-cover",
          )}
        />
      )}
    </>
  );
};
