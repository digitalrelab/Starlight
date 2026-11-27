import type { Entry, EntryRef } from "@starlight/client";
import { type ComponentType, Suspense, useEffect, useEffectEvent, useLayoutEffect, useState } from "react";
import { DirectoryFooter } from "./directory-footer.tsx";
import type { LayoutProps } from "./layouts/types.ts";
import { ListingMenu } from "./listing-menu.tsx";
import { useNamingSlot } from "./naming/use-naming-slot.tsx";
import { createSelection, selectionId, useFollow } from "./selection.ts";
import { useDwell } from "./use-dwell.ts";

interface Props {
  readonly projectId: string;
  readonly directory: EntryRef | null;
  readonly entries: ReadonlyArray<Entry>;
  readonly layout: ComponentType<LayoutProps>;
  readonly shown: EntryRef | null;
  readonly onOpen: (entry: Pick<Entry, "ref" | "kind">) => void;
  readonly onIntent: (entry: Entry) => void;
}

export const DirectoryView = ({
  projectId,
  directory,
  entries,
  layout: Layout,
  shown,
  onOpen,
  onIntent,
}: Props) => {
  const [selection] = useState(createSelection);
  const ids = entries.map(selectionId);
  useLayoutEffect(() => selection.setItems(ids), [selection, ids]);
  useFollow(selection, entries, shown);

  const [named, setNamed] = useState<EntryRef | null>(null);
  useFollow(selection, entries, named);
  const naming = useNamingSlot(projectId, directory, {
    openFile: (ref) => onOpen({ ref, kind: "file" }),
    land: setNamed,
  });

  const dwell = useDwell(onIntent);
  const intend = useEffectEvent((index: number) => dwell(entries[index]));
  useEffect(() => selection.subscribeFocus((index) => intend(index)), [selection]);
  const onHover = (index: number | null) => dwell(index === null ? undefined : entries[index]);

  const listing =
    entries.length === 0 && !naming ? (
      <div className="flex flex-1 items-center justify-center text-subtle">Empty folder</div>
    ) : (
      <div className="flex min-h-0 flex-1 flex-col">
        <Suspense fallback={<div className="flex-1" />}>
          <Layout
            projectId={projectId}
            directory={directory}
            entries={entries}
            selection={selection}
            naming={naming}
            onHover={onHover}
            onOpen={onOpen}
          />
        </Suspense>
        <DirectoryFooter selection={selection} total={entries.length} />
      </div>
    );

  return directory ? (
    <ListingMenu directory={directory} entries={entries} selection={selection}>
      {listing}
    </ListingMenu>
  ) : (
    listing
  );
};
