import { type Entry, type EntryRef, entryKey, type Media } from "@starlight/client";
import { ScrollArea } from "@starlight/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useStarlight } from "#renderer/lib/context.ts";
import { useElementWidth } from "#renderer/lib/use-element-width.ts";
import { useRevealFocus } from "#renderer/features/browser/selection.ts";
import { listProps, type Step } from "./events.ts";
import { dropLeading, justify, nearestInRow, shelve, stack } from "./rows.ts";
import { KindIcon } from "#renderer/features/files/kind-icon.tsx";
import { DraftChip, FolderChip, TILE_CHROME, TILE_INSET, Tile, tilePreviewUrl } from "./tile.tsx";
import { draftOf, fieldFor } from "./naming-slot.ts";
import type { LayoutProps } from "./types.ts";
import { usePreviewsAhead } from "#renderer/features/files/use-preview.ts";

const TARGET_ROW_HEIGHT = 200;
const MAX_ROW_HEIGHT = 320;
const GUTTER = 12;
const SECTION_GAP = 16;
const TILE_GAP = 4;
const CHIP_HEIGHT = 40;
const CHIP_MIN_WIDTH = 200;
const CHIP_GAP = 8;
const MIN_ASPECT = 0.5;
const MAX_ASPECT = 3;
const ICON_TILE_ASPECT = 1;

const indexByKey = (media: ReadonlyArray<Media>) => new Map(media.map((item) => [entryKey(item.ref), item]));

const leadingFolders = (entries: ReadonlyArray<Entry>) => {
  let count = 0;
  while (entries[count]?.kind === "directory") count++;
  return count;
};

const aspectOf = (media: Media | undefined) =>
  media ? Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, media.width / media.height)) : ICON_TILE_ASPECT;

const useMedia = (projectId: string, directory: EntryRef | null, entries: ReadonlyArray<Entry>) => {
  const { queries, subscriptions } = useStarlight();
  const { data } = useSuspenseQuery(queries.media(projectId, directory));
  useEffect(
    () => (directory ? subscriptions.media(projectId, directory) : undefined),
    [subscriptions, projectId, directory],
  );
  const byKey = indexByKey(data);
  return { byKey, aspects: Float64Array.from(entries, (entry) => aspectOf(byKey.get(entryKey(entry.ref)))) };
};

const useGridLayout = (
  entries: ReadonlyArray<Entry>,
  { byKey, aspects }: ReturnType<typeof useMedia>,
  width: number,
  drafting: boolean,
) => {
  const folderCount = leadingFolders(entries);
  const inner = Math.max(0, width - GUTTER * 2);
  const lead = drafting ? 1 : 0;
  const slots = shelve(folderCount + lead, {
    width: inner,
    minWidth: CHIP_MIN_WIDTH,
    height: CHIP_HEIGHT,
    gap: CHIP_GAP,
  });
  const shelf = dropLeading(slots, lead);
  const tiles = justify(aspects.subarray(folderCount), {
    width: inner + TILE_INSET * 2,
    targetHeight: TARGET_ROW_HEIGHT,
    maxHeight: MAX_ROW_HEIGHT,
    gap: TILE_GAP,
    chrome: TILE_CHROME,
  });
  const paddingStart = shelf.rows.length > 0 ? GUTTER : GUTTER - TILE_INSET;
  const layout = {
    ...stack(shelf, GUTTER, tiles, GUTTER - TILE_INSET, SECTION_GAP - TILE_INSET),
    folderCount,
    draftSlot:
      drafting && slots.width.length > 0
        ? { top: paddingStart, left: GUTTER + slots.left[0]!, width: slots.width[0]! }
        : null,
    paddingStart,
    paddingEnd: tiles.rows.length > 0 ? GUTTER - TILE_INSET : GUTTER,
  };
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
  projectId,
  directory,
  entries,
  selection,
  naming,
  onHover,
  onOpen,
}: LayoutProps) => {
  const draft = draftOf(naming);
  const scrollRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(scrollRef);
  const media = useMedia(projectId, directory, entries);
  const layout = useGridLayout(entries, media, width, draft !== null);

  const virtualizer = useVirtualizer({
    count: layout.rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => {
      const row = layout.rows[index];
      return row ? row.height + (index < layout.rows.length - 1 ? row.gap : 0) : 0;
    },
    paddingStart: layout.paddingStart,
    paddingEnd: layout.paddingEnd,
    overscan: 3,
  });

  useLayoutEffect(() => {
    virtualizer.measure();
  }, [virtualizer, layout]);

  useRevealFocus(
    selection,
    (index) => {
      const row = layout.rowOf[index];
      if (row !== undefined) virtualizer.scrollToIndex(row);
    },
    width > 0,
  );

  const vertical = (from: number, direction: 1 | -1) => {
    const row = layout.rows[(layout.rowOf[from] ?? 0) + direction];
    return row ? nearestInRow(layout, row, (layout.left[from] ?? 0) + (layout.width[from] ?? 0) / 2) : from;
  };

  const step: Step = (from, key) => {
    if (key === "ArrowRight") return from + 1;
    if (key === "ArrowLeft") return from - 1;
    if (key === "ArrowDown") return vertical(from, 1);
    if (key === "ArrowUp") return vertical(from, -1);
    return undefined;
  };

  return (
    <ScrollArea ref={scrollRef} {...listProps({ entries, selection, onOpen }, step)} className="flex-1">
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {draft && layout.draftSlot ? (
          <DraftChip {...layout.draftSlot} height={CHIP_HEIGHT}>
            <KindIcon kind={draft.kind} className="shrink-0" />
            {draft.field}
          </DraftChip>
        ) : null}
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
                  field: fieldFor(naming, key),
                  selection,
                  onHover,
                  onOpen,
                };
                return index < layout.folderCount ? (
                  <FolderChip key={key} {...cell} />
                ) : (
                  <Tile key={key} {...cell} media={media.byKey.get(key)} visible={visible} />
                );
              })}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
