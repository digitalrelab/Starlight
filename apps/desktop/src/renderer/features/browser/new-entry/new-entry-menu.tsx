import { Add01Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { Entry, EntryRef } from "@starlight/client";
import { ContextMenu, IconButton, Menu } from "@starlight/ui";
import { type ComponentProps, type ReactNode, useRef } from "react";
import { isOnItem } from "#renderer/features/browser/layouts/events.ts";
import { BLUEPRINTS, type Blueprint, startDraft } from "./draft.ts";

interface Props {
  readonly directory: EntryRef;
  readonly entries: ReadonlyArray<Entry>;
}

const useDraftStarter = ({ directory, entries }: Props, label: (blueprint: Blueprint) => string) => {
  const drafted = useRef(false);
  return {
    onOpenChange: (open: boolean) => {
      if (!open) return;
      drafted.current = false;
      for (const blueprint of BLUEPRINTS) blueprint.prepare?.();
    },
    finalFocus: () => !drafted.current,
    items: BLUEPRINTS.map((blueprint) => (
      <Menu.Item
        key={blueprint.label}
        icon={blueprint.icon}
        onClick={() => {
          drafted.current = true;
          startDraft(directory, blueprint, entries);
        }}
      >
        {label(blueprint)}
      </Menu.Item>
    )),
  };
};

export const NewEntryMenu = (props: Props) => {
  const { onOpenChange, finalFocus, items } = useDraftStarter(props, ({ label }) => label);
  return (
    <Menu.Root onOpenChange={onOpenChange}>
      <Menu.Trigger render={<IconButton icon={Add01Icon} label="New" />} />
      <Menu.Popup finalFocus={finalFocus}>{items}</Menu.Popup>
    </Menu.Root>
  );
};

const skipItems: ComponentProps<typeof ContextMenu.Trigger>["onContextMenu"] = (event) => {
  if (isOnItem(event.target)) event.preventBaseUIHandler();
};

export const NewEntryContextMenu = ({ children, ...props }: Props & { readonly children: ReactNode }) => {
  const { onOpenChange, finalFocus, items } = useDraftStarter(props, ({ label }) => `New ${label}`);
  return (
    <ContextMenu.Root onOpenChange={onOpenChange}>
      <ContextMenu.Trigger
        render={<div className="flex min-h-0 flex-1 flex-col" />}
        onContextMenu={skipItems}
      >
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Popup finalFocus={finalFocus}>{items}</ContextMenu.Popup>
    </ContextMenu.Root>
  );
};
