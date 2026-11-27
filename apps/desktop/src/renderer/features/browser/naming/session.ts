import { type CreatableKind, type Entry, type EntryRef, entryKey } from "@starlight/client";
import { useEffect } from "react";
import { defineStore, useStore } from "#renderer/lib/store.ts";
import { type Blueprint, freeName } from "./blueprints.ts";

interface Session {
  readonly key: number;
  readonly directory: string;
  readonly name: string;
}

export type Naming = Session &
  (
    | { readonly target: null; readonly kind: CreatableKind }
    | { readonly target: EntryRef; readonly kind: Entry["kind"] }
  );

const store = defineStore<Naming | null>(null);

let started = 0;

export const startCreating = (directory: EntryRef, blueprint: Blueprint, entries: ReadonlyArray<Entry>) =>
  store.set({
    key: ++started,
    directory: entryKey(directory),
    target: null,
    kind: blueprint.kind,
    name: freeName(blueprint, entries),
  });

export const startRenaming = (directory: EntryRef, entry: Entry) =>
  store.set({
    key: ++started,
    directory: entryKey(directory),
    target: entry.ref,
    kind: entry.kind,
    name: entry.name,
  });

export const endNaming = (naming: Naming) => {
  if (store.get() === naming) store.set(null);
};

export const useNaming = (directory: EntryRef | null) => {
  const key = directory && entryKey(directory);
  useEffect(
    () => () => {
      if (key !== null && store.get()?.directory === key) store.set(null);
    },
    [key],
  );
  const naming = useStore(store);
  return key !== null && naming?.directory === key ? naming : null;
};
