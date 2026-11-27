import { type Entry, type EntryRef, entryKey } from "@starlight/client";
import { Suspense, useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import { type LayoutId, layouts } from "./layouts/registry.ts";
import { createSelection, type SelectionStore, selectionId, useSelectedCount } from "./selection.ts";

interface Props {
  readonly projectId: string;
  readonly directory: EntryRef | null;
  readonly entries: ReadonlyArray<Entry>;
  readonly layout: LayoutId;
  readonly shown: EntryRef | null;
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

export const DirectoryView = ({ projectId, directory, entries, layout, shown, onOpen, onIntent }: Props) => {
  const [selection] = useState(createSelection);
  const ids = entries.map(selectionId);
  useLayoutEffect(() => selection.setItems(ids), [selection, ids]);

  const shownKey = shown && entryKey(shown);
  const shownEntry = shownKey ? entries.find((entry) => entryKey(entry.ref) === shownKey) : undefined;
  const shownId = shownEntry && selectionId(shownEntry);
  useLayoutEffect(() => {
    if (shownId) selection.follow(shownId);
  }, [selection, shownId]);

  const dwell = useDwell(onIntent);
  const intend = useEffectEvent((index: number) => dwell(entries[index]));
  useEffect(() => selection.subscribeFocus((index) => intend(index)), [selection]);
  const onHover = (index: number | null) => dwell(index === null ? undefined : entries[index]);

  if (entries.length === 0) {
    return <div className="flex flex-1 items-center justify-center text-subtle">Empty folder</div>;
  }

  const Layout = layouts[layout].component;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Suspense fallback={<div className="flex-1" />}>
        <Layout
          projectId={projectId}
          directory={directory}
          entries={entries}
          selection={selection}
          onHover={onHover}
          onOpen={onOpen}
        />
      </Suspense>
      <Footer selection={selection} total={entries.length} />
    </div>
  );
};

const Footer = ({ selection, total }: { readonly selection: SelectionStore; readonly total: number }) => {
  const selected = useSelectedCount(selection);
  return (
    <footer className="border-t border-default px-4 py-1 text-xs text-subtle tabular-nums">
      {selected > 0
        ? `${selected.toLocaleString()} of ${total.toLocaleString()} selected`
        : `${total.toLocaleString()} ${total === 1 ? "item" : "items"}`}
    </footer>
  );
};
