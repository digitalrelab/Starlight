import { type SelectionStore, useSelectedCount } from "./selection.ts";

export const DirectoryFooter = ({
  selection,
  total,
}: {
  readonly selection: SelectionStore;
  readonly total: number;
}) => {
  const selected = useSelectedCount(selection);
  return (
    <footer className="border-t border-default px-4 py-1 text-xs text-subtle tabular-nums">
      {selected > 0
        ? `${selected.toLocaleString()} of ${total.toLocaleString()} selected`
        : `${total.toLocaleString()} ${total === 1 ? "item" : "items"}`}
    </footer>
  );
};
