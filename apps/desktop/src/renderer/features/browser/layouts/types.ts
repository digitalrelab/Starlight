import type { Entry, EntryRef } from "@starlight/client";

export interface LayoutProps {
  readonly workspaceId: string;
  readonly directory: EntryRef | null;
  readonly entries: ReadonlyArray<Entry>;
  readonly selected: number;
  readonly onSelect: (index: number) => void;
  readonly onHover: (index: number | null) => void;
  readonly onOpen: (entry: Entry) => void;
}
