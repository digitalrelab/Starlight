import { Autocomplete, Dialog as BaseDialog } from "@base-ui/react";
import { cn } from "cn";
import { matchSorter, rankings } from "match-sorter";
import type { ReactNode } from "react";
import { dialogBackdrop, dialogOption, dialogPopup, dialogRows, dialogViewport } from "./dialog.ts";
import { ScrollArea } from "./scroll-area.tsx";

export interface CommandItem {
  readonly key: string;
  readonly label: string;
  readonly detail?: string | undefined;
  readonly leading: ReactNode;
  readonly run: () => unknown;
}

export interface CommandGroup {
  readonly label: string;
  readonly items: ReadonlyArray<CommandItem>;
}

interface DialogProps {
  readonly label: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly children: ReactNode;
}

const Dialog = ({ label, open, onOpenChange, children }: DialogProps) => (
  <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className={dialogBackdrop} />
      <BaseDialog.Viewport className={dialogViewport}>
        <BaseDialog.Popup aria-label={label} className={cn(dialogPopup, "w-160")}>
          {children}
        </BaseDialog.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  </BaseDialog.Root>
);

interface RootProps {
  readonly placeholder: string;
  readonly query: string;
  readonly onQueryChange: (query: string) => void;
  readonly groups: ReadonlyArray<CommandGroup>;
  readonly onActivate: (item: CommandItem) => void;
}

const labelOf = (item: CommandItem) => item.label;

const Root = ({ placeholder, query, onQueryChange, groups, onActivate }: RootProps) => (
  <Autocomplete.Root
    inline
    open
    items={groups}
    filter={null}
    autoHighlight="always"
    keepHighlight
    value={query}
    onValueChange={(value, { reason }) => {
      if (reason !== "item-press") onQueryChange(value);
    }}
    itemToStringValue={labelOf}
  >
    <Autocomplete.Input
      aria-label={placeholder}
      placeholder={placeholder}
      autoFocus
      className="h-14 shrink-0 bg-transparent px-dialog text-lg outline-none placeholder:text-subtlest"
    />
    <Autocomplete.Empty className="px-dialog pb-4 text-subtlest empty:hidden">No results</Autocomplete.Empty>
    <ScrollArea className="max-h-[min(28rem,56vh)]">
      <Autocomplete.List className={cn(dialogRows, "empty:hidden")}>
        {(group: CommandGroup) => (
          <Autocomplete.Group key={group.label} items={group.items} className="flex flex-col gap-0.5">
            <Autocomplete.GroupLabel className="flex h-8 items-center px-dialog-row text-xs font-medium text-subtle">
              {group.label}
            </Autocomplete.GroupLabel>
            <Autocomplete.Collection>
              {(item: CommandItem) => (
                <Autocomplete.Item
                  key={item.key}
                  value={item}
                  onClick={() => onActivate(item)}
                  className={dialogOption}
                >
                  <span className="flex size-5 shrink-0 items-center justify-center text-subtle">
                    {item.leading}
                  </span>
                  <span className="min-w-0 truncate">{item.label}</span>
                  {item.detail ? (
                    <span className="ml-auto max-w-1/2 min-w-0 shrink-0 truncate pl-4 text-subtlest">
                      {item.detail}
                    </span>
                  ) : null}
                </Autocomplete.Item>
              )}
            </Autocomplete.Collection>
          </Autocomplete.Group>
        )}
      </Autocomplete.List>
    </ScrollArea>
  </Autocomplete.Root>
);

const rank = (items: ReadonlyArray<CommandItem>, query: string): ReadonlyArray<CommandItem> =>
  query === ""
    ? items
    : matchSorter(items, query, {
        keys: ["label", "detail"],
        threshold: rankings.WORD_STARTS_WITH,
        baseSort: () => 0,
      });

export const Command = { Dialog, Root, rank };
