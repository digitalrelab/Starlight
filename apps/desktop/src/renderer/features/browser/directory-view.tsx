import { type Entry, type EntryRef, entryKey } from "@starlight/client";
import { type KeyboardEvent, Suspense, useCallback, useMemo } from "react";
import { type LayoutId, layouts } from "./layouts/registry.ts";

interface Props {
  readonly workspaceId: string;
  readonly directory: EntryRef | null;
  readonly entries: ReadonlyArray<Entry>;
  readonly layout: LayoutId;
  readonly selectedKey: string | undefined;
  readonly onSelectKey: (key: string | undefined) => void;
  readonly onOpen: (entry: Entry) => void;
}

export const DirectoryView = ({
  workspaceId,
  directory,
  entries,
  layout,
  selectedKey,
  onSelectKey,
  onOpen,
}: Props) => {
  const selected = useMemo(
    () => entries.findIndex((entry) => entryKey(entry.ref) === selectedKey),
    [entries, selectedKey],
  );
  const onSelect = useCallback(
    (index: number) => {
      const entry = entries[Math.max(0, Math.min(entries.length - 1, index))];
      onSelectKey(entry && entryKey(entry.ref));
    },
    [entries, onSelectKey],
  );

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
          onOpen={onOpen}
        />
      </Suspense>
      <footer className="border-t border-default px-4 py-1 text-xs text-subtle">
        {entries.length.toLocaleString()} {entries.length === 1 ? "item" : "items"}
      </footer>
    </div>
  );
};
