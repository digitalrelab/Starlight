import { PencilEdit02Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { Entry, EntryRef } from "@starlight/client";
import { ContextMenu, Menu } from "@starlight/ui";
import { type ReactNode, useState } from "react";
import { itemIndexAt } from "./layouts/events.ts";
import { NewEntryItems, useNewEntry } from "./naming/new-entry-menu.tsx";
import { startRenaming } from "./naming/session.ts";
import { useNamingMenu } from "./naming/use-naming-menu.ts";
import { type SelectionStore, selectionId } from "./selection.ts";

interface Props {
  readonly projectId: string;
  readonly directory: EntryRef;
  readonly entries: ReadonlyArray<Entry>;
  readonly selection: SelectionStore;
  readonly onOpen: (entry: Pick<Entry, "ref" | "kind">) => void;
  readonly children: ReactNode;
}

export const ListingMenu = ({ projectId, directory, entries, selection, onOpen, children }: Props) => {
  const { onOpenChange, finalFocus, start } = useNamingMenu();
  const pick = useNewEntry({ projectId, directory, entries, onOpen });
  const [target, setTarget] = useState<Entry | null>(null);
  return (
    <ContextMenu.Root onOpenChange={onOpenChange}>
      <ContextMenu.Trigger
        render={<div className="contents" />}
        onContextMenu={(event) => {
          const index = itemIndexAt(event.target);
          const entry = index === null ? undefined : entries[index];
          if (index !== null && entry && !selection.has(selectionId(entry)))
            selection.select(index, { toggle: false, extend: false });
          setTarget(entry ?? null);
        }}
      >
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Popup finalFocus={finalFocus}>
        {target ? (
          <Menu.Item icon={PencilEdit02Icon} onClick={start(() => startRenaming(directory, target))}>
            Rename
          </Menu.Item>
        ) : (
          <NewEntryItems pick={pick} start={start} label={({ label }) => `New ${label}`} />
        )}
      </ContextMenu.Popup>
    </ContextMenu.Root>
  );
};
