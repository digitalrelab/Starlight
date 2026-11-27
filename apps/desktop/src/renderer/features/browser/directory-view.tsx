import { type Entry, type EntryRef, entryKey } from "@starlight/client";
import { type KeyboardEvent, Suspense, useEffect, useRef } from "react";
import { type LayoutId, layouts } from "./layouts/registry.ts";

interface Props {
  readonly workspaceId: string;
  readonly directory: EntryRef | null;
  readonly entries: ReadonlyArray<Entry>;
  readonly layout: LayoutId;
  readonly selectedKey: string | undefined;
  readonly onSelectKey: (key: string | undefined) => void;
  readonly onOpen: (entry: Entry) => void;
  readonly onIntent: (entry: Entry) => void;
}

const INTENT_DWELL_MS = 100;

const useDwell = (onDwell: (entry: Entry) => void) => {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (entry: Entry | undefined) => {
    clearTimeout(timer.current);
    if (entry) timer.current = setTimeout(() => onDwell(entry), INTENT_DWELL_MS);
  };
};

export const DirectoryView = ({
  workspaceId,
  directory,
  entries,
  layout,
  selectedKey,
  onSelectKey,
  onOpen,
  onIntent,
}: Props) => {
  const selected = entries.findIndex((entry) => entryKey(entry.ref) === selectedKey);
  const dwell = useDwell(onIntent);
  const onSelect = (index: number) => {
    const entry = entries[Math.max(0, Math.min(entries.length - 1, index))];
    onSelectKey(entry && entryKey(entry.ref));
    dwell(entry);
  };
  const onHover = (index: number | null) => dwell(index === null ? undefined : entries[index]);

  if (entries.length === 0) {
    return <div className="flex flex-1 items-center justify-center text-subtle">Empty folder</div>;
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const entry = entries[selected];
    if (event.key !== "Enter" || !entry) return;
    event.preventDefault();
    onOpen(entry);
  };

  const Layout = layouts[layout].component;
  return (
    <div className="flex min-h-0 flex-1 flex-col" onKeyDown={onKeyDown}>
      <Suspense fallback={<div className="flex-1" />}>
        <Layout
          workspaceId={workspaceId}
          directory={directory}
          entries={entries}
          selected={selected}
          onSelect={onSelect}
          onHover={onHover}
          onOpen={onOpen}
        />
      </Suspense>
      <footer className="border-t border-default px-4 py-1 text-xs text-subtle">
        {entries.length.toLocaleString()} {entries.length === 1 ? "item" : "items"}
      </footer>
    </div>
  );
};
