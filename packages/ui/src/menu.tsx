import type { IconSvgElement } from "@hugeicons/react";
import { ContextMenu as BaseContextMenu, Menu as BaseMenu } from "@base-ui/react";
import { cn } from "cn";
import { type ComponentProps, createContext, type ReactNode, use, useRef, useState } from "react";
import { Icon } from "./icon.tsx";

const POSITIONING = { align: "start", sideOffset: 4, collisionPadding: 8 } as const;

const NATIVE_MENU_OWNERS = "input, textarea, select, [contenteditable]";

interface FilterState {
  readonly query: string;
  readonly width: number | null;
  readonly lock: (width: number) => void;
}

const FilterContext = createContext<FilterState>({ query: "", width: null, lock: () => {} });

const Filter = ({ children }: { readonly children: (reset: (open: boolean) => void) => ReactNode }) => {
  const [query, setQuery] = useState("");
  const [width, setWidth] = useState<number | null>(null);
  const reset = (open: boolean) => {
    if (!open) return;
    setQuery("");
    setWidth(null);
  };
  return (
    <BaseMenu.FilterProvider
      value={query}
      autoHighlight
      onValueChange={(value, { reason }) => {
        if (reason !== "popup-close") setQuery(value);
      }}
    >
      <FilterContext value={{ query, width, lock: (next) => setWidth((current) => current ?? next) }}>
        {children(reset)}
      </FilterContext>
    </BaseMenu.FilterProvider>
  );
};

const Body = ({ children }: { readonly children: ReactNode }) => {
  const filter = use(FilterContext);
  const list = useRef<HTMLDivElement>(null);
  return (
    <BaseMenu.Popup className="flex max-h-(--available-height) min-w-48 origin-(--transform-origin) flex-col overflow-hidden rounded-lg bg-surface-overlay shadow-overlay outline-none transition-[opacity,scale] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
      <BaseMenu.Input
        aria-label="Filter"
        placeholder="Filter…"
        onChange={() => list.current && filter.lock(list.current.offsetWidth)}
        className={cn(
          "h-10 shrink-0 border-b border-default bg-transparent px-3.5 outline-none placeholder:text-subtlest",
          filter.query === "" && "sr-only",
        )}
      />
      <BaseMenu.Empty className="px-3.5 py-2 text-subtlest">No matches</BaseMenu.Empty>
      <BaseMenu.List
        ref={list}
        style={{ minWidth: filter.width ?? undefined }}
        data-filtering={filter.query === "" ? undefined : ""}
        className="group/list flex flex-col p-1.5"
      >
        {children}
      </BaseMenu.List>
    </BaseMenu.Popup>
  );
};

const Root = ({ onOpenChange, ...props }: ComponentProps<typeof BaseMenu.Root>) => (
  <Filter>
    {(reset) => (
      <BaseMenu.Root
        modal={false}
        onOpenChange={(open, details) => {
          reset(open);
          onOpenChange?.(open, details);
        }}
        {...props}
      />
    )}
  </Filter>
);

const Popup = ({ children }: { readonly children: ReactNode }) => (
  <BaseMenu.Portal>
    <BaseMenu.Positioner {...POSITIONING} className="z-overlay outline-none">
      <Body>{children}</Body>
    </BaseMenu.Positioner>
  </BaseMenu.Portal>
);

interface ItemProps extends Omit<ComponentProps<typeof BaseMenu.Item>, "className"> {
  readonly icon: IconSvgElement;
}

const Item = ({ icon, children, ...props }: ItemProps) => (
  <BaseMenu.Item
    className="flex min-h-8 shrink-0 items-center gap-2 rounded-md px-2 text-subtle outline-none select-none data-[highlighted]:bg-neutral data-[highlighted]:text-default"
    {...props}
  >
    <Icon icon={icon} className="shrink-0" />
    {children}
  </BaseMenu.Item>
);

const Separator = () => (
  <BaseMenu.Separator className="-mx-1.5 my-1.5 border-t border-default group-data-[filtering]/list:hidden" />
);

const ContextRoot = ({ onOpenChange, ...props }: ComponentProps<typeof BaseContextMenu.Root>) => (
  <Filter>
    {(reset) => (
      <BaseContextMenu.Root
        onOpenChange={(open, details) => {
          reset(open);
          onOpenChange?.(open, details);
        }}
        {...props}
      />
    )}
  </Filter>
);

const ContextTrigger = ({ onContextMenu, ...props }: ComponentProps<typeof BaseContextMenu.Trigger>) => (
  <BaseContextMenu.Trigger
    onContextMenu={(event) => {
      if (event.target instanceof Element && event.target.closest(NATIVE_MENU_OWNERS)) {
        event.preventBaseUIHandler();
        return;
      }
      onContextMenu?.(event);
    }}
    {...props}
  />
);

const ContextPopup = ({ children }: { readonly children: ReactNode }) => (
  <BaseContextMenu.Portal>
    <BaseContextMenu.Positioner {...POSITIONING} className="z-overlay outline-none">
      <Body>{children}</Body>
    </BaseContextMenu.Positioner>
  </BaseContextMenu.Portal>
);

export const Menu = { Root, Trigger: BaseMenu.Trigger, Popup, Item, Separator };
export const ContextMenu = { Root: ContextRoot, Trigger: ContextTrigger, Popup: ContextPopup };
