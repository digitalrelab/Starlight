import type { Entry, EntryRef } from "@starlight/client";
import type { SelectionStore } from "#renderer/features/browser/selection.ts";
import type { NamingSlot } from "./naming-slot.ts";

export interface LayoutProps {
  readonly projectId: string;
  readonly directory: EntryRef | null;
  readonly entries: ReadonlyArray<Entry>;
  readonly selection: SelectionStore;
  readonly naming: NamingSlot | null;
  readonly onHover: (index: number | null) => void;
  readonly onOpen: (entry: Entry) => void;
}
