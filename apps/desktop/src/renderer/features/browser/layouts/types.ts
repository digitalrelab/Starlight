import type { Entry, EntryRef } from "@starlight/client";
import type { ReactNode } from "react";
import type { SelectionStore } from "#renderer/features/browser/selection.ts";

export interface LayoutProps {
  readonly projectId: string;
  readonly directory: EntryRef | null;
  readonly entries: ReadonlyArray<Entry>;
  readonly selection: SelectionStore;
  readonly draft: ReactNode;
  readonly onHover: (index: number | null) => void;
  readonly onOpen: (entry: Entry) => void;
}
