import { Image01Icon, Tick02Icon } from "@hugeicons-pro/core-stroke-rounded";
import { type Entry, entryKey, type Media } from "@starlight/client";
import { cn, Icon, ScrollArea } from "@starlight/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { type KeyboardEvent, memo, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef } from "react";
import { previewUrl } from "#shared/previews.ts";
import { useStarlight } from "#renderer/lib/context.ts";
import { placeholderUrl } from "#renderer/lib/placeholder.ts";
import { reveal } from "#renderer/lib/reveal.ts";
import { useElementWidth } from "#renderer/lib/use-element-width.ts";
import { KindIcon, itemKindOf } from "#renderer/features/files/kind-icon.tsx";
import { justify, nearestInRow, shelve, stack } from "./justify.ts";
import type { LayoutProps } from "./types.ts";
import { usePreview, usePreviewsAhead } from "./use-preview.ts";

const TARGET_ROW_HEIGHT = 200;
const MAX_ROW_HEIGHT = 320;
const GUTTER = 12;
const SECTION_GAP = 16;
const TILE_INSET = 4;
const TILE_GAP = 4;
const CAPTION_HEIGHT = 28;
const CHIP_HEIGHT = 40;
const CHIP_MIN_WIDTH = 200;
const CHIP_GAP = 8;
const MIN_ASPECT = 0.5;
const MAX_ASPECT = 3;
const ICON_TILE_ASPECT = 1;
const CHROME = { width: TILE_INSET * 2, height: TILE_INSET * 2 + CAPTION_HEIGHT };

const indexByKey = (media: ReadonlyArray<Media>) => new Map(media.map((item) => [entryKey(item.ref), item]));

const leadingFolders = (entries: ReadonlyArray<Entry>) => {
  let count = 0;
  while (entries[count]?.kind === "directory") count++;
  return count;
};

const tilePreviewUrl = (media: Media, width: number, height: number) =>
  previewUrl(media.token, Math.max(width - CHROME.width, height - CHROME.height) * window.devicePixelRatio);

const aspectOf = (media: Media | undefined) =>
  media ? Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, media.width / media.height)) : ICON_TILE_ASPECT;

export const GridLayout = ({
  workspaceId,
  directory,
  entries,
  selected,
  onSelect,
  onHover,
  onOpen,
}: LayoutProps) => {
  const { queries, subscriptions } = useStarlight();
  const { data } = useSuspenseQuery(queries.media(workspaceId, directory));
  useEffect(
    () => (directory ? subscriptions.media(workspaceId, directory) : undefined),
    [subscriptions, workspaceId, directory, entries],
  );
  const media = useMemo(() => indexByKey(data), [data]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(scrollRef);
  const folders = useMemo(() => leadingFolders(entries), [entries]);

  const aspects = useMemo(
    () => Float64Array.from(entries.slice(folders), (entry) => aspectOf(media.get(entryKey(entry.ref)))),
    [entries, folders, media],
  );
  const layout = useMemo(() => {
    const inner = Math.max(0, width - GUTTER * 2);
    const shelf = shelve(folders, {
      width: inner,
      minWidth: CHIP_MIN_WIDTH,
      height: CHIP_HEIGHT,
      gap: CHIP_GAP,
    });
    const tiles = justify(aspects, {
      width: inner + TILE_INSET * 2,
      targetHeight: TARGET_ROW_HEIGHT,
      maxHeight: MAX_ROW_HEIGHT,
      gap: TILE_GAP,
      chrome: CHROME,
    });
    return { ...stack(shelf, GUTTER, tiles, GUTTER - TILE_INSET), shelfRows: shelf.rows.length };
  }, [aspects, folders, width]);

  const ahead = useMemo(
    () =>
      layout.rows.flatMap((row) =>
        entries.slice(row.start, row.end).flatMap((entry, offset) => {
          const found = media.get(entryKey(entry.ref));
          return found ? [tilePreviewUrl(found, layout.width[row.start + offset] ?? 0, row.height)] : [];
        }),
      ),
    [layout, entries, media],
  );
  usePreviewsAhead(ahead);

  const hasTiles = layout.rows.length > layout.shelfRows;
  const rowGap = (index: number) => {
    if (index === layout.rows.length - 1) return 0;
    if (index < layout.shelfRows - 1) return CHIP_GAP;
    if (index === layout.shelfRows - 1) return SECTION_GAP - TILE_INSET;
    return TILE_GAP;
  };

  const virtualizer = useVirtualizer({
    count: layout.rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => (layout.rows[index]?.height ?? 0) + rowGap(index),
    paddingStart: layout.shelfRows > 0 ? GUTTER : GUTTER - TILE_INSET,
    paddingEnd: hasTiles ? GUTTER - TILE_INSET : GUTTER,
    overscan: 3,
  });

  useLayoutEffect(() => {
    virtualizer.measure();
  }, [virtualizer, layout]);

  const ready = layout.rows.length > 0;
  const revealSelected = useEffectEvent(() => {
    const row = layout.rowOf[selected];
    if (row !== undefined) virtualizer.scrollToIndex(row);
  });
  const selectedEntry = entries[selected];
  const selectedKey = selectedEntry && entryKey(selectedEntry.ref);
  useEffect(() => {
    if (ready) revealSelected();
  }, [ready, selectedKey]);

  const moveVertically = (direction: 1 | -1) => {
    if (selected < 0) return onSelect(0);
    const row = layout.rows[(layout.rowOf[selected] ?? 0) + direction];
    if (!row) return;
    onSelect(nearestInRow(layout, row, (layout.left[selected] ?? 0) + (layout.width[selected] ?? 0) / 2));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") onSelect(selected + 1);
    else if (event.key === "ArrowLeft") onSelect(selected - 1);
    else if (event.key === "ArrowDown") moveVertically(1);
    else if (event.key === "ArrowUp") moveVertically(-1);
    else return;
    event.preventDefault();
  };

  return (
    <ScrollArea ref={scrollRef} tabIndex={0} onKeyDown={onKeyDown} className="flex-1">
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => {
          const row = layout.rows[item.index];
          if (!row) return null;
          const visible =
            !!virtualizer.range &&
            item.index >= virtualizer.range.startIndex &&
            item.index <= virtualizer.range.endIndex;
          return (
            <div
              key={item.index}
              className="absolute inset-x-0 top-0"
              style={{ height: row.height, transform: `translateY(${item.start}px)` }}
            >
              {entries.slice(row.start, row.end).map((entry, offset) => {
                const index = row.start + offset;
                const key = entryKey(entry.ref);
                const cell = {
                  index,
                  entry,
                  left: layout.left[index] ?? 0,
                  width: layout.width[index] ?? 0,
                  height: row.height,
                  selected: index === selected,
                  onSelect,
                  onHover,
                  onOpen,
                };
                return index < folders ? (
                  <FolderChip key={key} {...cell} />
                ) : (
                  <Tile key={key} {...cell} media={media.get(key)} visible={visible} />
                );
              })}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

interface CellProps {
  readonly index: number;
  readonly entry: Entry;
  readonly left: number;
  readonly width: number;
  readonly height: number;
  readonly selected: boolean;
  readonly onSelect: (index: number) => void;
  readonly onHover: (index: number | null) => void;
  readonly onOpen: (entry: Entry) => void;
}

const cellEvents = ({ index, entry, onSelect, onHover, onOpen }: CellProps) => ({
  onClick: () => onSelect(index),
  onDoubleClick: () => onOpen(entry),
  onPointerEnter: () => onHover(index),
  onPointerLeave: () => onHover(null),
});

const FolderChip = memo((props: CellProps) => {
  const { entry, left, width, height, selected } = props;
  return (
    <div
      {...cellEvents(props)}
      title={entry.name}
      className={cn(
        "absolute top-0 flex min-w-0 cursor-interactive items-center gap-2.5 rounded-md px-3",
        selected ? "bg-selected text-selected" : "bg-surface-sunken hover:bg-neutral-subtle-hovered",
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

const Tile = memo((props: TileProps) => {
  const { entry, media, left, width, height, visible, selected } = props;
  const kind = itemKindOf(entry);
  return (
    <div
      {...cellEvents(props)}
      title={entry.name}
      className={cn(
        "group absolute top-0 flex cursor-interactive flex-col rounded-lg",
        entry.hidden && "opacity-50",
      )}
      style={{ left, width, height, padding: TILE_INSET }}
    >
      <div
        className={cn(
          "relative min-h-0 flex-1 overflow-hidden rounded-md bg-surface-sunken outline-2 outline-offset-2",
          selected
            ? "outline-(--border-color-selected) group-hover:outline-(--border-color-selected-hovered)"
            : "outline-transparent group-hover:outline-(--text-color-subtlest)",
        )}
      >
        {media ? (
          <Preview
            url={tilePreviewUrl(media, width, height)}
            placeholder={media.placeholder}
            visible={visible}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center [container-type:size]">
            <KindIcon kind={kind} className="size-[clamp(1.25rem,20cqmin,2.5rem)]" />
          </span>
        )}
        {selected && (
          <>
            <span className="pointer-events-none absolute inset-0 bg-selected-overlay/60" />
            <span className="absolute top-1.5 left-1.5 grid size-5 place-items-center rounded-full bg-selected-bold text-inverse shadow-sm">
              <Icon icon={Tick02Icon} size={12} strokeWidth={2.5} />
            </span>
          </>
        )}
      </div>
      <div
        className="flex shrink-0 items-start gap-1.5 px-1 pt-1.5 text-sm"
        style={{ height: CAPTION_HEIGHT }}
      >
        <KindIcon kind={kind} size={14} className="mt-0.75" />
        <span className="min-w-0 truncate">{entry.name}</span>
      </div>
    </div>
  );
});

interface PreviewProps {
  readonly url: string;
  readonly placeholder: string | null;
  readonly visible: boolean;
}

const Preview = ({ url, placeholder, visible }: PreviewProps) => {
  const src = usePreview(url, visible);
  return (
    <>
      {placeholder ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${placeholderUrl(placeholder)})` }}
        />
      ) : (
        <Icon
          icon={Image01Icon}
          size={24}
          className="absolute top-1/2 left-1/2 -translate-1/2 text-subtlest"
        />
      )}
      {src && (
        <img
          src={src}
          alt=""
          decoding="async"
          draggable={false}
          onLoad={reveal}
          className="relative size-full object-cover opacity-0 transition-opacity duration-150 data-loaded:opacity-100"
        />
      )}
    </>
  );
};
