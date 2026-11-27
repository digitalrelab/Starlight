import { Add01Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { Entry, EntryRef } from "@starlight/client";
import { IconButton, Menu } from "@starlight/ui";
import { BLUEPRINTS, type Blueprint } from "./blueprints.ts";
import { startCreating } from "./session.ts";
import { useNamingMenu } from "./use-naming-menu.ts";

interface Props {
  readonly directory: EntryRef;
  readonly entries: ReadonlyArray<Entry>;
}

export const NewEntryItems = ({
  directory,
  entries,
  start,
  label,
}: Props & {
  readonly start: ReturnType<typeof useNamingMenu>["start"];
  readonly label: (blueprint: Blueprint) => string;
}) =>
  BLUEPRINTS.map((blueprint) => (
    <Menu.Item
      key={blueprint.label}
      icon={blueprint.icon}
      onClick={start(() => startCreating(directory, blueprint, entries))}
    >
      {label(blueprint)}
    </Menu.Item>
  ));

export const NewEntryMenu = (props: Props) => {
  const { onOpenChange, finalFocus, start } = useNamingMenu();
  return (
    <Menu.Root onOpenChange={onOpenChange}>
      <Menu.Trigger render={<IconButton icon={Add01Icon} label="New" />} />
      <Menu.Popup finalFocus={finalFocus}>
        <NewEntryItems {...props} start={start} label={({ label }) => label} />
      </Menu.Popup>
    </Menu.Root>
  );
};
