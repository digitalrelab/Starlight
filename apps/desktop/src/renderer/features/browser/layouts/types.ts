import type { Entry, EntryRef } from "@starlight/client";
import type { ReactElement } from "react";
import type { ItemKind } from "#renderer/features/files/kind-icon.tsx";
import type { SelectionStore } from "#renderer/features/browser/selection.ts";

export interface NamingSlot {
  readonly entry: string | null;
  readonly kind: ItemKind;
  readonly field: ReactElement;
}

export const fieldFor = (naming: NamingSlot | null, entry: string) =>
  naming?.entry === entry ? naming.field : undefined;

export interface LayoutProps {
  readonly projectId: string;
  readonly directory: EntryRef | null;
  readonly entries: ReadonlyArray<Entry>;
  readonly selection: SelectionStore;
  readonly naming: NamingSlot | null;
  readonly onHover: (index: number | null) => void;
  readonly onOpen: (entry: Entry) => void;
}
