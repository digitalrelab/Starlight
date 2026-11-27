import { File01Icon, FolderIcon, Image01Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { Entry, Media } from "@starlight/client";
import { cn, Icon } from "@starlight/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  type KeyboardEvent,
  memo,
  type ReactNode,
  type SyntheticEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { thumbnailUrl } from "../../../../shared/thumbnails.ts";
import { useStarlight } from "../../../lib/context.ts";
import { useElementWidth } from "../../../lib/use-element-width.ts";
import { justify, nearestInRow } from "./justify.ts";
import type { LayoutProps } from "./types.ts";

const TARGET_ROW_HEIGHT = 200;
const MAX_ROW_HEIGHT = 320;
const GAP = 4;
const PADDING = 8;
const MIN_ASPECT = 0.5;
const MAX_ASPECT = 3;
const PLACEHOLDER_ASPECT = 1;

const indexByPath = (media: ReadonlyArray<Media>) => new Map(media.map((item) => [item.path, item]));

const aspectOf = (media: Media | undefined) =>
  media ? Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, media.width / media.height)) : PLACEHOLDER_ASPECT;

const reveal = (event: SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.dataset["loaded"] = "";
};

export const GridLayout = ({ workspaceId, path, entries, selected, onSelect, onOpen }: LayoutProps) => {
  const { queries } = useStarlight();
  const { data } = useSuspenseQuery(queries.media(workspaceId, path));
  const media = useMemo(() => indexByPath(data), [data]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(scrollRef);

  const aspects = useMemo(
    () => Float64Array.from(entries, (entry) => aspectOf(media.get(entry.path))),
    [entries, media],
  );
  const layout = useMemo(
    () =>
      justify(aspects, {
        width: width - PADDING * 2,
        targetHeight: TARGET_ROW_HEIGHT,
        maxHeight: MAX_ROW_HEIGHT,
        gap: GAP,
      }),
    [aspects, width],
  );

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

  useEffect(() => {
    const row = layout.rowOf[selected];
    if (row !== undefined) virtualizer.scrollToIndex(row);
  }, [virtualizer, layout, selected]);

  const moveVertically = (direction: 1 | -1) => {
    if (selected < 0) return onSelect(0);
    const row = layout.rows[(layout.rowOf[selected] ?? 0) + direction];
    if (!row) return;
    onSelect(nearestInRow(layout, row, (layout.left[selected] ?? 0) + (layout.width[selected] ?? 0) / 2));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") onSelect(selected + 1);
    else if (event.key === "ArrowLeft") onSelect(Math.max(0, selected - 1));
    else if (event.key === "ArrowDown") moveVertically(1);
    else if (event.key === "ArrowUp") moveVertically(-1);
    else if (event.key === "Enter" && entries[selected]) onOpen(entries[selected]);
    else return;
    event.preventDefault();
  };

  return (
    <div
      ref={scrollRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="min-h-0 flex-1 overflow-y-auto outline-none [scrollbar-gutter:stable]"
    >
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => {
          const row = layout.rows[item.index];
          if (!row) return null;
          const tiles: Array<ReactNode> = [];
          for (let index = row.start; index < row.end; index++) {
            const entry = entries[index];
            if (!entry) continue;
            tiles.push(
              <Tile
                key={entry.path}
                index={index}
                entry={entry}
                media={media.get(entry.path)}
                left={PADDING + (layout.left[index] ?? 0)}
                width={layout.width[index] ?? 0}
                height={row.height}
                selected={index === selected}
                onSelect={onSelect}
                onOpen={onOpen}
              />,
            );
          }
          return (
            <div
              key={item.index}
              className="absolute inset-x-0 top-0"
              style={{ height: row.height, transform: `translateY(${item.start}px)` }}
            >
              {tiles}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface TileProps {
  readonly index: number;
  readonly entry: Entry;
  readonly media: Media | undefined;
  readonly left: number;
  readonly width: number;
  readonly height: number;
  readonly selected: boolean;
  readonly onSelect: (index: number) => void;
  readonly onOpen: (entry: Entry) => void;
}

const Tile = memo(({ index, entry, media, left, width, height, selected, onSelect, onOpen }: TileProps) => {
  const isDir = entry.kind === "directory";
  return (
    <div
      onClick={() => onSelect(index)}
      onDoubleClick={() => onOpen(entry)}
      title={entry.name}
      className={cn(
        "absolute top-0 overflow-hidden rounded-md bg-hover",
        "outline-offset-[-3px] outline-accent",
        selected && "outline-3",
        entry.hidden && "opacity-50",
      )}
      style={{ left, width, height }}
    >
      {media ? (
        <>
          <Icon
            icon={Image01Icon}
            size={24}
            className="absolute top-1/2 left-1/2 -translate-1/2 text-muted opacity-40"
          />
          <img
            src={thumbnailUrl(media.thumbnail, Math.max(width, height) * window.devicePixelRatio)}
            alt=""
            decoding="async"
            draggable={false}
            onLoad={reveal}
            className="relative size-full object-cover opacity-0 transition-opacity duration-150 data-loaded:opacity-100"
          />
        </>
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-2 p-3">
          <Icon
            icon={isDir ? FolderIcon : File01Icon}
            size={40}
            strokeWidth={1.25}
            className={isDir ? "text-accent" : "text-muted"}
          />
          <span className="w-full truncate text-center text-[12px]">{entry.name}</span>
        </div>
      )}
    </div>
  );
});
