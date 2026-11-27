import { type Entry, entryKey } from "@starlight/client";
import { cn, ScrollArea } from "@starlight/ui";
import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, type ReactElement, useRef } from "react";
import { formatDate, formatSize } from "#renderer/lib/format.ts";
import { KindIcon, itemKindOf } from "#renderer/features/files/kind-icon.tsx";
import { useRevealFocus } from "#renderer/features/browser/selection.ts";
import { type ItemHandlers, listProps, useItem, verticalStep } from "./events.ts";
import { draftOf, fieldFor } from "./naming-slot.ts";
import type { LayoutProps } from "./types.ts";

const ROW_HEIGHT = 26;
const COLUMNS = "grid grid-cols-[minmax(0,1fr)_96px_168px] gap-4";
const ROW = cn(COLUMNS, "absolute inset-x-2 items-center rounded-md px-2");
const NAME = "flex min-w-0 items-center gap-2";

export const TableLayout = ({ entries, selection, naming, onHover, onOpen }: LayoutProps) => {
  const draft = draftOf(naming);
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    paddingStart: draft ? ROW_HEIGHT : 0,
    overscan: 16,
  });

  useRevealFocus(selection, (index) => virtualizer.scrollToIndex(index));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={cn(COLUMNS, "border-b border-default px-4 py-1.5 text-xs font-medium text-subtle")}>
        <span>Name</span>
        <span className="text-right">Size</span>
        <span>Modified</span>
      </div>
      <ScrollArea
        ref={scrollRef}
        {...listProps({ entries, selection, onOpen }, verticalStep)}
        className="flex-1"
      >
        <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
          {draft ? (
            <div className={ROW} style={{ height: ROW_HEIGHT }}>
              <span className={NAME}>
                <KindIcon kind={draft.kind} className="shrink-0" />
                {draft.field}
              </span>
            </div>
          ) : null}
          {virtualizer.getVirtualItems().map((row) => {
            const entry = entries[row.index];
            if (!entry) return null;
            const key = entryKey(entry.ref);
            return (
              <Row
                key={key}
                index={row.index}
                entry={entry}
                field={fieldFor(naming, key)}
                start={row.start}
                selection={selection}
                onHover={onHover}
                onOpen={onOpen}
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

interface RowProps extends ItemHandlers {
  readonly index: number;
  readonly entry: Entry;
  readonly field: ReactElement | undefined;
  readonly start: number;
}

const Row = memo(({ index, entry, field, start, ...handlers }: RowProps) => {
  const { selected, props } = useItem(index, entry, handlers);
  return (
    <div
      {...props}
      className={cn(
        ROW,
        selected ? "bg-selected hover:bg-selected-hovered" : "hover:bg-neutral-subtle-hovered",
        entry.hidden && "opacity-50",
      )}
      style={{ height: ROW_HEIGHT, transform: `translateY(${start}px)` }}
    >
      <span className={NAME}>
        <KindIcon kind={itemKindOf(entry)} />
        {field ?? <span className="truncate">{entry.name}</span>}
      </span>
      <span className="text-right text-subtle tabular-nums">
        {entry.kind === "directory" ? "—" : formatSize(entry.size)}
      </span>
      <span className="truncate text-subtle tabular-nums">{formatDate(entry.modifiedAt)}</span>
    </div>
  );
});
