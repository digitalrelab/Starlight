import type { IconSvgElement } from "@hugeicons/react";
import { Menu as BaseMenu } from "@base-ui/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "cn";
import { Icon } from "./icon.tsx";

const Popup = ({ children }: { readonly children: ReactNode }) => (
  <BaseMenu.Portal>
    <BaseMenu.Positioner sideOffset={4} collisionPadding={8} className="z-overlay outline-none">
      <BaseMenu.Popup className="min-w-40 origin-(--transform-origin) rounded-lg bg-surface-overlay p-1.5 shadow-overlay outline-none transition-[opacity,scale] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
        {children}
      </BaseMenu.Popup>
    </BaseMenu.Positioner>
  </BaseMenu.Portal>
);

interface ItemProps extends Omit<ComponentProps<typeof BaseMenu.Item>, "className"> {
  readonly icon: IconSvgElement;
  readonly tone?: "default" | "danger";
}

const Item = ({ icon, tone = "default", children, ...props }: ItemProps) => (
  <BaseMenu.Item
    className={cn(
      "flex h-8 items-center gap-2 rounded-md px-2 outline-none select-none data-[highlighted]:bg-neutral",
      tone === "danger" ? "text-danger" : "text-subtle data-[highlighted]:text-default",
    )}
    {...props}
  >
    <Icon icon={icon} />
    {children}
  </BaseMenu.Item>
);

export const Menu = { Root: BaseMenu.Root, Trigger: BaseMenu.Trigger, Popup, Item };
