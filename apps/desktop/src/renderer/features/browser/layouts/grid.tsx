import { Image01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { type Entry, entryKey, type Media } from "@starlight/client";
import { cn, Icon, ScrollArea } from "@starlight/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { type KeyboardEvent, memo, useEffect, useEffectEvent, useLayoutEffect, useRef } from "react";
import { previewUrl } from "#shared/previews.ts";
import { useStarlight } from "#renderer/lib/context.ts";
import { reveal } from "#renderer/lib/reveal.ts";
import { useElementWidth } from "#renderer/lib/use-element-width.ts";
import { KindIcon, itemKindOf } from "#renderer/features/files/kind-icon.tsx";
import { justify, nearestInRow } from "./justify.ts";
import type { LayoutProps } from "./types.ts";
import { usePreview, usePreviewsAhead } from "./use-preview.ts";

const TARGET_ROW_HEIGHT = 200;
const MAX_ROW_HEIGHT = 320;
const GAP = 4;
const PADDING = 8;
const MIN_ASPECT = 0.5;
const MAX_ASPECT = 3;
const ICON_TILE_ASPECT = 1;

const indexByKey = (media: ReadonlyArray<Media>) => new Map(media.map((item) => [entryKey(item.ref), item]));

const tilePreviewUrl = (media: Media, width: number, height: number) =>
  previewUrl(media.token, Math.max(width, height) * window.devicePixelRatio);

const aspectOf = (media: Media | undefined) =>
  media ? Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, media.width / media.height)) : ICON_TILE_ASPECT;

const useMedia = ({
  workspaceId,
  directory,
  entries,
}: Pick<LayoutProps, "workspaceId" | "directory" | "entries">) => {
  const { queries } = useStarlight();
  const { data } = useSuspenseQuery(queries.media(workspaceId, directory));
  const byKey = indexByKey(data);
  return { byKey, aspects: Float64Array.from(entries, (entry) => aspectOf(byKey.get(entryKey(entry.ref)))) };
};

const useGridLayout = (
  entries: LayoutProps["entries"],
  { byKey, aspects }: ReturnType<typeof useMedia>,
  width: number,
) => {
  const layout = justify(aspects, {
    width: width - PADDING * 2,
    targetHeight: TARGET_ROW_HEIGHT,
    maxHeight: MAX_ROW_HEIGHT,
    gap: GAP,
  });
  usePreviewsAhead(
    layout.rows.flatMap((row) =>
      entries.slice(row.start, row.end).flatMap((entry, offset) => {
        const found = byKey.get(entryKey(entry.ref));
        return found ? [tilePreviewUrl(found, layout.width[row.start + offset] ?? 0, row.height)] : [];
      }),
    ),
  );
  return layout;
};

export const GridLayout = ({
  workspaceId,
  directory,
  entries,
  selected,
  onSelect,
  onHover,
  onOpen,
}: LayoutProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(scrollRef);
  const media = useMedia({ workspaceId, directory, entries });
  const layout = useGridLayout(entries, media, width);

  const virtualizer = useVirtualizer({
    count: layout.rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => (layout.rows[index]?.height ?? 0) + GAP,
    paddingStart: PADDING,
    paddingEnd: PADDING - GAP,
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
                return (
                  <Tile
                    key={key}
                    index={index}
                    entry={entry}
                    media={media.byKey.get(key)}
                    left={PADDING + (layout.left[index] ?? 0)}
                    width={layout.width[index] ?? 0}
                    height={row.height}
                    visible={visible}
                    selected={index === selected}
                    onSelect={onSelect}
                    onHover={onHover}
                    onOpen={onOpen}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

interface TileProps {
  readonly index: number;
  readonly entry: Entry;
  readonly media: Media | undefined;
  readonly left: number;
  readonly width: number;
  readonly height: number;
  readonly visible: boolean;
  readonly selected: boolean;
  readonly onSelect: (index: number) => void;
  readonly onHover: (index: number | null) => void;
  readonly onOpen: (entry: Entry) => void;
}

const Tile = memo(
  ({ index, entry, media, left, width, height, visible, selected, onSelect, onHover, onOpen }: TileProps) => {
    return (
      <div
        onClick={() => onSelect(index)}
        onDoubleClick={() => onOpen(entry)}
        onPointerEnter={() => onHover(index)}
        onPointerLeave={() => onHover(null)}
        title={entry.name}
        className={cn(
          "absolute top-0 overflow-hidden rounded-md bg-neutral",
          selected && "ring-3 ring-selected",
          entry.hidden && "opacity-50",
        )}
        style={{ left, width, height }}
      >
        {media ? (
          <Preview url={tilePreviewUrl(media, width, height)} visible={visible} />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 p-3">
            <KindIcon kind={itemKindOf(entry)} size={40} />
            <span className="w-full truncate text-center text-sm">{entry.name}</span>
          </div>
        )}
      </div>
    );
  },
);

const Preview = ({ url, visible }: { readonly url: string; readonly visible: boolean }) => {
  const src = usePreview(url, visible);
  return (
    <>
      <Icon icon={Image01Icon} size={24} className="absolute top-1/2 left-1/2 -translate-1/2 text-subtlest" />
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
