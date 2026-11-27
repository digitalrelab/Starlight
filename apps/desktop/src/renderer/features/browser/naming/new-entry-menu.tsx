import { Add01Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { Entry, EntryRef } from "@starlight/client";
import { IconButton, Menu } from "@starlight/ui";
import { useMutation } from "@tanstack/react-query";
import { useStarlight } from "#renderer/lib/context.ts";
import { BLUEPRINTS, type Blueprint, freeName } from "./blueprints.ts";
import { startCreating } from "./session.ts";
import { useNamingMenu } from "./use-naming-menu.ts";

export interface NewEntryOptions {
  readonly projectId: string;
  readonly directory: EntryRef;
  readonly entries: ReadonlyArray<Entry>;
  readonly onOpen: (entry: Pick<Entry, "ref" | "kind">) => void;
}

export const useNewEntry = ({ projectId, directory, entries, onOpen }: NewEntryOptions) => {
  const { mutations } = useStarlight();
  const create = useMutation(mutations.nameEntry(projectId, directory));
  return (blueprint: Blueprint) => {
    if (!blueprint.instant) return startCreating(directory, blueprint, entries);
    create.mutate(
      { name: freeName(blueprint, entries), kind: blueprint.kind },
      {
        onSuccess: (ref) => onOpen({ ref, kind: blueprint.kind }),
        onError: (error) => startCreating(directory, blueprint, entries, error.message),
      },
    );
  };
};

export const NewEntryItems = ({
  pick,
  start,
  label,
}: {
  readonly pick: (blueprint: Blueprint) => void;
  readonly start: ReturnType<typeof useNamingMenu>["start"];
  readonly label: (blueprint: Blueprint) => string;
}) =>
  BLUEPRINTS.map((blueprint) => (
    <Menu.Item key={blueprint.label} icon={blueprint.icon} onClick={start(() => pick(blueprint))}>
      {label(blueprint)}
    </Menu.Item>
  ));

export const NewEntryMenu = (props: NewEntryOptions) => {
  const { onOpenChange, finalFocus, start } = useNamingMenu();
  const pick = useNewEntry(props);
  return (
    <Menu.Root onOpenChange={onOpenChange}>
      <Menu.Trigger render={<IconButton icon={Add01Icon} label="New" />} />
      <Menu.Popup finalFocus={finalFocus}>
        <NewEntryItems pick={pick} start={start} label={({ label }) => label} />
      </Menu.Popup>
    </Menu.Root>
  );
};
