import type { IconSvgElement } from "@hugeicons/react";
import { ContextMenu as BaseContextMenu, Menu as BaseMenu } from "@base-ui/react";
import { cn } from "cn";
import { type ComponentProps, createContext, type ReactNode, use, useRef, useState } from "react";
import { Icon } from "./icon.tsx";
import { popupSurface } from "./popup.ts";

const POSITIONING = { align: "start", sideOffset: 4, collisionPadding: 8 } as const;

const NATIVE_MENU_OWNERS = "input, textarea, select, [contenteditable]";

interface FilterState {
  readonly query: string;
  readonly width: number | null;
  readonly lock: (width: number) => void;
}

const FilterContext = createContext<FilterState>({ query: "", width: null, lock: () => {} });

type Settle = (onOpenChangeComplete?: (open: boolean) => void) => (open: boolean) => void;

const Filter = ({ children }: { readonly children: (settle: Settle) => ReactNode }) => {
  const [query, setQuery] = useState("");
  const [width, setWidth] = useState<number | null>(null);
  const settle: Settle = (onOpenChangeComplete) => (open) => {
    if (!open) {
      setQuery("");
      setWidth(null);
    }
    onOpenChangeComplete?.(open);
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
        {children(settle)}
      </FilterContext>
    </BaseMenu.FilterProvider>
  );
};

interface BodyProps {
  readonly finalFocus?: ComponentProps<typeof BaseMenu.Popup>["finalFocus"];
  readonly className?: string | undefined;
  readonly children: ReactNode;
}

const Body = ({ finalFocus, className, children }: BodyProps) => {
  const filter = use(FilterContext);
  const list = useRef<HTMLDivElement>(null);
  return (
    <BaseMenu.Popup
      finalFocus={finalFocus}
      className={cn(
        popupSurface,
        "flex max-h-(--available-height) min-w-48 flex-col overflow-hidden",
        className,
      )}
    >
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

const Root = ({ onOpenChangeComplete, ...props }: ComponentProps<typeof BaseMenu.Root>) => (
  <Filter>
    {(settle) => (
      <BaseMenu.Root modal={false} onOpenChangeComplete={settle(onOpenChangeComplete)} {...props} />
    )}
  </Filter>
);

const Popup = ({ finalFocus, className, children }: BodyProps) => (
  <BaseMenu.Portal>
    <BaseMenu.Positioner {...POSITIONING} className="z-overlay outline-none">
      <Body finalFocus={finalFocus} className={className}>
        {children}
      </Body>
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

const ContextRoot = ({ onOpenChangeComplete, ...props }: ComponentProps<typeof BaseContextMenu.Root>) => (
  <Filter>
    {(settle) => <BaseContextMenu.Root onOpenChangeComplete={settle(onOpenChangeComplete)} {...props} />}
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

const ContextPopup = ({ finalFocus, children }: BodyProps) => (
  <BaseContextMenu.Portal>
    <BaseContextMenu.Positioner {...POSITIONING} className="z-overlay outline-none">
      <Body finalFocus={finalFocus}>{children}</Body>
    </BaseContextMenu.Positioner>
  </BaseContextMenu.Portal>
);

export const Menu = { Root, Trigger: BaseMenu.Trigger, Popup, Item, Separator };
export const ContextMenu = { Root: ContextRoot, Trigger: ContextTrigger, Popup: ContextPopup };
