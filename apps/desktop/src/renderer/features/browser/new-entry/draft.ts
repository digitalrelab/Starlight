import { FolderIcon } from "@hugeicons-pro/core-stroke-rounded";
import { type CreatableKind, type Entry, type EntryRef, entryKey } from "@starlight/client";
import type { IconProps } from "@starlight/ui";
import { useEffect } from "react";
import { MarkdownIcon } from "#renderer/features/files/markdown-icon.ts";
import { loadEditor } from "#renderer/features/viewer/markdown-file.ts";
import { defineStore, useStore } from "#renderer/lib/store.ts";

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
  { label: "Markdown", icon: MarkdownIcon, kind: "file", extension: ".md", prepare: loadEditor },
];

export interface Draft {
  readonly key: number;
  readonly directory: string;
  readonly kind: CreatableKind;
  readonly name: string;
}

const freeName = ({ extension }: Blueprint, entries: ReadonlyArray<Entry>) => {
  const taken = new Set(entries.map(({ name }) => name.toLowerCase()));
  for (let n = 1; ; n++) {
    const name = `${n === 1 ? STEM : `${STEM} ${n}`}${extension}`;
    if (!taken.has(name.toLowerCase())) return name;
  }
};

const store = defineStore<Draft | null>(null);

let started = 0;

export const startDraft = (directory: EntryRef, blueprint: Blueprint, entries: ReadonlyArray<Entry>) =>
  store.set({
    key: ++started,
    directory: entryKey(directory),
    kind: blueprint.kind,
    name: freeName(blueprint, entries),
  });

export const endDraft = (draft: Draft) => {
  if (store.get() === draft) store.set(null);
};

export const useDraft = (directory: EntryRef | null) => {
  const key = directory && entryKey(directory);
  useEffect(
    () => () => {
      if (key !== null && store.get()?.directory === key) store.set(null);
    },
    [key],
  );
  const draft = useStore(store);
  return key !== null && draft?.directory === key ? draft : null;
};
