import { type EntryRef, entryKey } from "@starlight/client";
import { itemKindOf } from "#renderer/features/files/kind-icon.tsx";
import type { NamingSlot } from "#renderer/features/browser/layouts/naming-slot.ts";
import { NameField } from "./name-field.tsx";
import { useNaming } from "./session.ts";

interface Outcomes {
  readonly openFile: (file: EntryRef) => void;
  readonly land: (entry: EntryRef) => void;
}

export const useNamingSlot = (
  projectId: string,
  directory: EntryRef | null,
  { openFile, land }: Outcomes,
): NamingSlot | null => {
  const naming = useNaming(directory);
  if (!naming || !directory) return null;
  return {
    entry: naming.target && entryKey(naming.target),
    kind: itemKindOf(naming),
    field: (
      <NameField
        key={naming.key}
        projectId={projectId}
        directory={directory}
        naming={naming}
        onNamed={(ref) => (naming.target === null && naming.kind === "file" ? openFile(ref) : land(ref))}
      />
    ),
  };
};
