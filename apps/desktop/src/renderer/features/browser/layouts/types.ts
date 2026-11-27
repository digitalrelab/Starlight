import type { Entry } from "@starlight/client";

export interface LayoutProps {
  readonly workspaceId: string;
  readonly path: string;
  readonly entries: ReadonlyArray<Entry>;
  readonly selected: number;
  readonly onSelect: (index: number) => void;
  readonly onOpen: (entry: Entry) => void;
}
