import { FolderIcon } from "@hugeicons-pro/core-stroke-rounded";
import type { CreatableKind, Entry } from "@starlight/client";
import type { IconProps } from "@starlight/ui";
import { MarkdownIcon } from "#renderer/features/files/markdown-icon.ts";
import { loadMarkdownEditor } from "#renderer/features/viewer/editors.ts";

const STEM = "Untitled";

export interface Blueprint {
  readonly label: string;
  readonly icon: IconProps["icon"];
  readonly kind: CreatableKind;
  readonly extension: string;
  readonly prepare?: () => unknown;
}

export const BLUEPRINTS: ReadonlyArray<Blueprint> = [
  { label: "Folder", icon: FolderIcon, kind: "directory", extension: "" },
  { label: "Markdown", icon: MarkdownIcon, kind: "file", extension: ".md", prepare: loadMarkdownEditor },
];

export const freeName = ({ extension }: Blueprint, entries: ReadonlyArray<Entry>) => {
  const taken = new Set(entries.map(({ name }) => name.toLowerCase()));
  for (let n = 1; ; n++) {
    const name = `${n === 1 ? STEM : `${STEM} ${n}`}${extension}`;
    if (!taken.has(name.toLowerCase())) return name;
  }
};
