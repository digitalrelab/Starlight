import type { Entry } from "@starlight/client";
import { type KeyboardEvent, Suspense, useCallback, useState } from "react";
import { type LayoutId, layouts } from "./layouts/registry.ts";

interface Props {
  readonly workspaceId: string;
  readonly path: string;
  readonly entries: ReadonlyArray<Entry>;
  readonly layout: LayoutId;
  readonly onOpen: (entry: Entry) => void;
}

export const DirectoryView = ({ workspaceId, path, entries, layout, onOpen }: Props) => {
  const [selected, setSelected] = useState(-1);
  const onSelect = useCallback(
    (index: number) => setSelected(Math.max(0, Math.min(entries.length - 1, index))),
    [entries.length],
  );

  if (entries.length === 0) {
    return <div className="flex flex-1 items-center justify-center text-muted">Empty folder</div>;
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
          path={path}
          entries={entries}
          selected={selected}
          onSelect={onSelect}
          onOpen={onOpen}
        />
      </Suspense>
      <footer className="border-t border-border px-4 py-1 text-[11px] text-muted">
        {entries.length.toLocaleString()} {entries.length === 1 ? "item" : "items"}
      </footer>
    </div>
  );
};
