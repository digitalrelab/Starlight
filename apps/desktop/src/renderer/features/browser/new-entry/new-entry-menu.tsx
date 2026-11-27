import { Add01Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { Entry, EntryRef } from "@starlight/client";
import { IconButton, Menu } from "@starlight/ui";
import { useRef } from "react";
import { BLUEPRINTS, startDraft } from "./draft.ts";

interface Props {
  readonly directory: EntryRef;
  readonly entries: ReadonlyArray<Entry>;
}

export const NewEntryMenu = ({ directory, entries }: Props) => {
  const drafted = useRef(false);
  return (
    <Menu.Root
      onOpenChange={(open) => {
        if (!open) return;
        drafted.current = false;
        for (const blueprint of BLUEPRINTS) blueprint.prepare?.();
      }}
    >
      <Menu.Trigger render={<IconButton icon={Add01Icon} label="New" />} />
      <Menu.Popup finalFocus={() => !drafted.current}>
        {BLUEPRINTS.map((blueprint) => (
          <Menu.Item
            key={blueprint.label}
            icon={blueprint.icon}
            onClick={() => {
              drafted.current = true;
              startDraft(directory, blueprint, entries);
            }}
          >
            {blueprint.label}
          </Menu.Item>
        ))}
      </Menu.Popup>
    </Menu.Root>
  );
};
