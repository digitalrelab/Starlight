import { PencilEdit02Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { Entry } from "@starlight/client";
import { ContextMenu, Menu } from "@starlight/ui";
import { type ReactNode, useState } from "react";
import { itemIndexAt } from "./layouts/events.ts";
import { type NewEntryOptions, NewEntryItems, useNewEntry } from "./naming/new-entry-menu.tsx";
import { startRenaming } from "./naming/session.ts";
import { useNamingMenu } from "./naming/use-naming-menu.ts";
import { type SelectionStore, selectionId } from "./selection.ts";

interface Props extends NewEntryOptions {
  readonly selection: SelectionStore;
  readonly children: ReactNode;
}

export const ListingMenu = ({ selection, children, ...options }: Props) => {
  const { directory, entries } = options;
  const { onOpenChange, finalFocus, start } = useNamingMenu();
  const pick = useNewEntry(options);
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
