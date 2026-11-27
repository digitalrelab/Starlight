import { type Crumb, type Entry, type EntryRef, entryKey } from "@starlight/client";
import { ResizeHandle } from "@starlight/ui";
import {
  Fragment,
  type KeyboardEvent,
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { directoryKey } from "#renderer/features/browser/directory-search.ts";
import { DirectoryFooter } from "#renderer/features/browser/directory-footer.tsx";
import { chosenEntry } from "#renderer/features/browser/layouts/events.ts";
import { useNamingSlot } from "#renderer/features/browser/naming/use-naming-slot.tsx";
import { createSelection, selectionId, useFollow } from "#renderer/features/browser/selection.ts";
import { useDwell } from "#renderer/features/browser/use-dwell.ts";
import { useStarlight } from "#renderer/lib/context.ts";
import { Column, type PanelColumn, type PanelControls } from "./column.tsx";
import { useCachedEntries, useColumnEntries } from "./entries.ts";
import { type Place, usePlace } from "./place.ts";
import { PreviewColumn } from "./preview.tsx";
import { usePaneWidths } from "./widths.ts";

interface Props {
  readonly projectId: string;
  readonly projectName: string;
  readonly directory: EntryRef | null;
  readonly trail: ReadonlyArray<Crumb>;
  readonly shown: EntryRef | null;
  readonly onNavigate: (directory: EntryRef | null) => void;
  readonly onOpenFile: (directory: EntryRef, file: EntryRef) => void;
}

type Landing = { readonly key: string } | "first";

interface Intent {
  readonly place: Place;
  readonly entry: Entry;
}

const childOf = (place: Place, entry: Entry): Place => ({
  directory: entry.ref,
  trail: [...place.trail, { ref: entry.ref, name: entry.name }],
});

const parentOf = ({ trail }: Place): Place | undefined =>
  trail.length === 0 ? undefined : { directory: trail.at(-2)?.ref ?? null, trail: trail.slice(0, -1) };

const columnsOf = (at: Place, rootName: string, revealed: Entry | undefined): ReadonlyArray<PanelColumn> => {
  const crumbs = [{ ref: null, name: rootName }, ...at.trail];
  const last = crumbs.length - 1;
  return [
    ...crumbs.map((crumb, depth): PanelColumn => ({
      depth,
      name: crumb.name,
      place: { directory: crumb.ref, trail: at.trail.slice(0, depth) },
      role: depth === last ? "current" : "ancestor",
      openKey:
        depth === last
          ? revealed && entryKey(revealed.ref)
          : at.trail[depth] && entryKey(at.trail[depth].ref),
    })),
    ...(revealed
      ? [
          {
            depth: crumbs.length,
            name: revealed.name,
            place: childOf(at, revealed),
            role: "revealed" as const,
            openKey: undefined,
          },
        ]
      : []),
  ];
};

const useStableControls = (controls: PanelControls): PanelControls => {
  const latest = useRef(controls);
  useLayoutEffect(() => {
    latest.current = controls;
  });
  const [stable] = useState<PanelControls>(() => ({
    pick: (...args) => latest.current.pick(...args),
    open: (...args) => latest.current.open(...args),
    clear: (...args) => latest.current.clear(...args),
    hover: (...args) => latest.current.hover(...args),
    keyDown: (...args) => latest.current.keyDown(...args),
    takeFocus: () => latest.current.takeFocus(),
  }));
  return stable;
};

export const PanelView = ({
  projectId,
  projectName,
  directory,
  trail,
  shown,
  onNavigate,
  onOpenFile,
}: Props) => {
  const { queryClient, queries, subscriptions } = useStarlight();
  const [selection] = useState(createSelection);
  const rootRef = useRef<HTMLDivElement>(null);
  const landing = useRef<Landing>(undefined);
  const wantsFocus = useRef(false);
  const previousTrail = useRef(trail);
  const [repeating, setRepeating] = useState(false);
  const cached = useCachedEntries(projectId);
  const widths = usePaneWidths();
  const id = useId();

  const { at, go } = usePlace({ directory, trail }, onNavigate, (arrival) => {
    const before = previousTrail.current;
    const onPath = arrival.trail.every(
      (crumb, index) => before[index] !== undefined && entryKey(before[index].ref) === entryKey(crumb.ref),
    );
    const child = onPath ? before[arrival.trail.length] : undefined;
    landing.current = child && { key: entryKey(child.ref) };
    wantsFocus.current = rootRef.current?.contains(document.activeElement) ?? false;
  });

  const { entries: current } = useColumnEntries(projectId, at.directory);
  const byId = new Map(current?.map((entry) => [selectionId(entry), entry]));

  const settle = (entries: ReadonlyArray<Entry>) => {
    const land = landing.current;
    landing.current = undefined;
    const target =
      land === "first" ? entries[0] : land && entries.find(({ ref }) => entryKey(ref) === land.key);
    if (target) selection.follow(selectionId(target));
  };
  const settleCurrent = useEffectEvent((entries: ReadonlyArray<Entry>) => settle(entries));
  useLayoutEffect(() => {
    selection.setItems(current?.map(selectionId) ?? []);
    if (current) settleCurrent(current);
  }, [selection, current]);

  useLayoutEffect(() => {
    previousTrail.current = at.trail;
  });

  useFollow(selection, current, shown);
  const [named, setNamed] = useState<EntryRef | null>(null);
  useFollow(selection, current, named);
  const naming = useNamingSlot(projectId, at.directory, {
    openFile: (ref) => {
      if (at.directory) onOpenFile(at.directory, ref);
    },
    land: setNamed,
  });

  const soleId = useSyncExternalStore(selection.subscribe, selection.sole);
  const sole = soleId === undefined ? undefined : byId.get(soleId);
  const revealed = sole?.kind === "directory" ? sole : undefined;
  const preview =
    sole?.kind === "file" && at.directory ? { entry: sole, directory: at.directory } : undefined;
  const columns = columnsOf(at, projectName, revealed);

  const previewKey = preview ? directoryKey(preview.directory) : "";
  const subscribeMedia = useEffectEvent(() =>
    preview ? subscriptions.media(projectId, preview.directory) : undefined,
  );
  useEffect(() => (previewKey ? subscribeMedia() : undefined), [previewKey]);

  const prefetch = ({ place, entry }: Intent) => {
    const query =
      entry.kind === "directory"
        ? queryClient.query(queries.entries(projectId, entry.ref))
        : entry.kind === "file" && place.directory
          ? queryClient.query(queries.fileDetails(projectId, place.directory, entry.ref))
          : undefined;
    void query?.catch(() => undefined);
  };
  const dwell = useDwell(prefetch);
  const dwellAround = useDwell((index: number) => {
    for (const entry of current?.slice(Math.max(0, index - 1), index + 2) ?? [])
      prefetch({ place: at, entry });
  });
  const onFocus = useEffectEvent((index: number) => dwellAround(index));
  useEffect(() => selection.subscribeFocus((index) => onFocus(index)), [selection]);

  const move = (place: Place, land?: Landing) => {
    wantsFocus.current = rootRef.current?.contains(document.activeElement) ?? false;
    const entries = cached(place.directory);
    selection.setItems(entries?.map(selectionId) ?? []);
    landing.current = land;
    if (entries) settle(entries);
    go(place);
  };

  const open = (place: Place, entry: Entry) => {
    if (entry.kind === "directory") move(childOf(place, entry), "first");
    else if (entry.kind === "file" && place.directory) onOpenFile(place.directory, entry.ref);
  };

  const chosen = () => current && chosenEntry({ entries: current, selection });

  const controls = useStableControls({
    pick: (column, index, entry, modifiers) => {
      setRepeating(false);
      if (column.role === "current") selection.select(index, modifiers);
      else move(column.place, { key: entryKey(entry.ref) });
    },
    open,
    clear: (column) => {
      if (column.role === "current") selection.clear();
      else if (column.role === "ancestor") move(column.place);
    },
    hover: (place, entry) => dwell(entry && { place, entry }),
    keyDown: (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return false;
      if (event.key === "ArrowUp" || event.key === "ArrowDown") setRepeating(event.repeat);
      if (event.key === "ArrowLeft") {
        const parent = parentOf(at);
        if (parent) move(parent, { key: directoryKey(at.directory) });
      } else if (event.key === "ArrowRight") {
        const entry = chosen();
        if (entry?.kind === "directory" && selection.selectedCount() === 1 && cached(entry.ref)?.length !== 0)
          move(childOf(at, entry), "first");
      } else if (event.key === " ") {
        const entry = chosen();
        if (entry?.kind === "file") open(at, entry);
      } else return false;
      return true;
    },
    takeFocus: () => {
      const wants = wantsFocus.current;
      wantsFocus.current = false;
      return wants;
    },
  });

  const columnId = (depth: number) => `${id}column-${depth}`;
  const previewId = `${id}preview`;
  const lastPaneId = preview ? previewId : columnId(columns.length - 1);
  useLayoutEffect(() => {
    document.getElementById(lastPaneId)?.scrollIntoView({ block: "nearest", inline: "end" });
  }, [lastPaneId]);

  return (
    <div ref={rootRef} className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 scroll-pr-3 overflow-x-auto overflow-y-hidden p-3 pr-1">
        {columns.map((column) => {
          const elementId = columnId(column.depth);
          const width = widths.column(column.depth);
          return (
            <Fragment key={directoryKey(column.place.directory)}>
              <Column
                projectId={projectId}
                elementId={elementId}
                width={width.size}
                column={column}
                selection={selection}
                naming={column.role === "current" ? naming : null}
                defers={column.role === "revealed" && repeating}
                controls={controls}
              />
              <ResizeHandle controls={elementId} label="Resize column" {...width} />
            </Fragment>
          );
        })}
        {preview ? (
          <>
            <PreviewColumn
              key={entryKey(preview.entry.ref)}
              projectId={projectId}
              elementId={previewId}
              width={widths.preview.size}
              directory={preview.directory}
              entry={preview.entry}
              defers={repeating}
              onOpen={() => open(at, preview.entry)}
            />
            <ResizeHandle controls={previewId} label="Resize preview" {...widths.preview} />
          </>
        ) : null}
      </div>
      <DirectoryFooter selection={selection} total={current?.length ?? 0} />
    </div>
  );
};
