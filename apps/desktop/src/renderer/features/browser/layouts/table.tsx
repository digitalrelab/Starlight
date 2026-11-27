import { cn } from "@starlight/ui";
import { useVirtualizer } from "@tanstack/react-virtual";
import { type KeyboardEvent, useEffect, useRef } from "react";
import { formatDate, formatSize } from "../../../lib/format.ts";
import { EntryIcon } from "../entry-icon.tsx";
import type { LayoutProps } from "./types.ts";

const ROW_HEIGHT = 26;
const COLUMNS = "grid grid-cols-[minmax(0,1fr)_96px_168px] gap-4";

export const TableLayout = ({ entries, selected, onSelect, onOpen }: LayoutProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 16,
  });

  useEffect(() => {
    if (selected >= 0) virtualizer.scrollToIndex(selected);
  }, [virtualizer, selected]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown") onSelect(selected + 1);
    else if (event.key === "ArrowUp") onSelect(selected - 1);
    else return;
    event.preventDefault();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={cn(COLUMNS, "border-b border-default px-4 py-1.5 text-xs font-medium text-subtle")}>
        <span>Name</span>
        <span className="text-right">Size</span>
        <span>Modified</span>
      </div>
      <div
        ref={scrollRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="min-h-0 flex-1 overflow-auto outline-none"
      >
        <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((row) => {
            const entry = entries[row.index];
            if (!entry) return null;
            return (
              <div
                key={entry.path}
                onClick={() => onSelect(row.index)}
                onDoubleClick={() => onOpen(entry)}
                className={cn(
                  COLUMNS,
                  "absolute inset-x-2 items-center rounded-md px-2",
                  row.index === selected
                    ? "bg-selected hover:bg-selected-hovered"
                    : "hover:bg-neutral-subtle-hovered",
                  entry.hidden && "opacity-50",
                )}
                style={{ height: ROW_HEIGHT, transform: `translateY(${row.start}px)` }}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <EntryIcon entry={entry} />
                  <span className="truncate">{entry.name}</span>
                </span>
                <span className="text-right text-subtle tabular-nums">
                  {entry.kind === "directory" ? "—" : formatSize(entry.size)}
                </span>
                <span className="truncate text-subtle tabular-nums">{formatDate(entry.modifiedAt)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
