import { Add01Icon, FolderIcon } from "@hugeicons-pro/core-stroke-rounded";
import { type CreatableKind, type Entry, EntryExists, type EntryRef, InvalidName } from "@starlight/client";
import { IconButton, Menu, NameDialog } from "@starlight/ui";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { MarkdownIcon } from "#renderer/features/files/markdown-icon.ts";
import { useStarlight } from "#renderer/lib/context.ts";

const STEM = "Untitled";

const BLUEPRINTS = [
  { action: "New Folder", icon: FolderIcon, kind: "directory", extension: "" },
  { action: "New Markdown File", icon: MarkdownIcon, kind: "file", extension: ".md" },
] as const;

type Blueprint = (typeof BLUEPRINTS)[number];

const freeName = ({ extension }: Blueprint, entries: ReadonlyArray<Entry>) => {
  const taken = new Set(entries.map(({ name }) => name.toLowerCase()));
  for (let n = 1; ; n++) {
    const name = `${n === 1 ? STEM : `${STEM} ${n}`}${extension}`;
    if (!taken.has(name.toLowerCase())) return name;
  }
};

const describe = (error: Error) =>
  error instanceof EntryExists
    ? "Something with this name is already here."
    : error instanceof InvalidName
      ? "Names can’t contain “/” or “\\”, or be “.” or “..”."
      : error.message;

interface Props {
  readonly projectId: string;
  readonly directory: EntryRef;
  readonly directoryName: string;
  readonly entries: ReadonlyArray<Entry>;
  readonly onCreated: (created: { readonly ref: EntryRef; readonly kind: CreatableKind }) => void;
}

export const NewEntryMenu = ({ projectId, directory, directoryName, entries, onCreated }: Props) => {
  const { mutations } = useStarlight();
  const create = useMutation(mutations.createEntry(projectId, directory));
  const [open, setOpen] = useState(false);
  const [blueprint, setBlueprint] = useState<Blueprint>(BLUEPRINTS[0]);
  const [name, setName] = useState("");

  const start = (next: Blueprint) => {
    create.reset();
    setBlueprint(next);
    setName(freeName(next, entries));
    setOpen(true);
  };

  const edit = (next: string) => {
    if (create.isError) create.reset();
    setName(next);
  };

  const submit = () => {
    const { kind } = blueprint;
    create.mutate(
      { name: name.trim(), kind },
      {
        onSuccess: (ref) => {
          setOpen(false);
          onCreated({ ref, kind });
        },
      },
    );
  };

  return (
    <>
      <Menu.Root>
        <Menu.Trigger render={<IconButton icon={Add01Icon} label="New" />} />
        <Menu.Popup>
          {BLUEPRINTS.map((blueprint) => (
            <Menu.Item key={blueprint.action} icon={blueprint.icon} onClick={() => start(blueprint)}>
              {`${blueprint.action}…`}
            </Menu.Item>
          ))}
        </Menu.Popup>
      </Menu.Root>
      <NameDialog
        open={open}
        onOpenChange={setOpen}
        action={blueprint.action}
        subject={directoryName}
        icon={blueprint.icon}
        value={name}
        onValueChange={edit}
        error={create.error && describe(create.error)}
        pending={create.isPending}
        onSubmit={submit}
      />
    </>
  );
};
