import type { Entry } from "@starlight/client";
import { cn, FileIcon, FolderIcon } from "@starlight/ui";
import { useVirtualizer } from "@tanstack/react-virtual";
import { type KeyboardEvent, useRef, useState } from "react";
import { formatDate, formatSize } from "../../lib/format.ts";

const ROW_HEIGHT = 26;
const COLUMNS = "grid grid-cols-[minmax(0,1fr)_96px_168px] gap-4";

interface Props {
  readonly entries: ReadonlyArray<Entry>;
  readonly onOpen: (entry: Entry) => void;
}

export const EntryList = ({ entries, onOpen }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(-1);
  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 16,
  });

  const select = (index: number) => {
    const next = Math.max(0, Math.min(entries.length - 1, index));
    setSelected(next);
    virtualizer.scrollToIndex(next);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown") select(selected + 1);
    else if (event.key === "ArrowUp") select(selected - 1);
    else if (event.key === "Enter" && entries[selected]) onOpen(entries[selected]);
    else return;
    event.preventDefault();
  };

  if (entries.length === 0) {
    return <div className="flex flex-1 items-center justify-center text-muted">Empty folder</div>;
  }

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
                onClick={() => setSelected(row.index)}
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
                  {isDir ? (
                    <FolderIcon className="shrink-0 text-accent" />
                  ) : (
                    <FileIcon className="shrink-0 text-muted" />
                  )}
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
      <footer className="border-t border-border px-4 py-1 text-[11px] text-muted">
        {entries.length.toLocaleString()} {entries.length === 1 ? "item" : "items"}
      </footer>
    </div>
  );
};
