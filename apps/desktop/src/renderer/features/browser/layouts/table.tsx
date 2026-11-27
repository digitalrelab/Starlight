import { File01Icon, FolderIcon } from "@hugeicons-pro/core-stroke-rounded";
import { cn, Icon } from "@starlight/ui";
import { useVirtualizer } from "@tanstack/react-virtual";
import { type KeyboardEvent, useEffect, useRef } from "react";
import { formatDate, formatSize } from "../../../lib/format.ts";
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
    else if (event.key === "Enter" && entries[selected]) onOpen(entries[selected]);
    else return;
    event.preventDefault();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={cn(COLUMNS, "border-b border-border px-4 py-1.5 text-[11px] font-medium text-muted")}>
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
            const isDir = entry.kind === "directory";
            return (
              <div
                key={entry.path}
                onClick={() => onSelect(row.index)}
                onDoubleClick={() => onOpen(entry)}
                className={cn(
                  COLUMNS,
                  "absolute inset-x-2 items-center rounded-md px-2",
                  row.index === selected ? "bg-selected" : "hover:bg-hover",
                  entry.hidden && "opacity-50",
                )}
                style={{ height: ROW_HEIGHT, transform: `translateY(${row.start}px)` }}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Icon
                    icon={isDir ? FolderIcon : File01Icon}
                    className={cn("shrink-0", isDir ? "text-accent" : "text-muted")}
                  />
                  <span className="truncate">{entry.name}</span>
                </span>
                <span className="text-right text-muted tabular-nums">
                  {isDir ? "—" : formatSize(entry.size)}
                </span>
                <span className="truncate text-muted tabular-nums">{formatDate(entry.modifiedAt)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
