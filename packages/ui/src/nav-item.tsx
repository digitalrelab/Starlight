import type { IconSvgElement } from "@hugeicons/react";
import { MoreHorizontalIcon } from "@hugeicons-pro/core-stroke-rounded";
import { mergeProps, useRender } from "@base-ui/react";
import { cn } from "cn";
import type { ReactNode } from "react";
import { Icon } from "./icon.tsx";
import { IconButton } from "./icon-button.tsx";
import { ContextMenu, Menu } from "./menu.tsx";

export interface NavItemProps extends useRender.ComponentProps<"button"> {
  readonly icon?: IconSvgElement | undefined;
  readonly menu?: { readonly label: string; readonly items: ReactNode } | undefined;
}

const NavItemControl = ({ icon, render, className, children, ...props }: Omit<NavItemProps, "menu">) =>
  useRender({
    render,
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "group flex h-8 w-full items-center gap-2 rounded-md px-2 text-base text-default focus-ring",
          "highlighted:bg-neutral-subtle-hovered group-has-data-[popup-open]/nav-item:bg-neutral-subtle-hovered disabled:opacity-50",
          "aria-[current=page]:bg-selected aria-[current=page]:text-selected",
          "aria-[current=page]:highlighted:bg-selected-hovered aria-[current=page]:group-has-data-[popup-open]/nav-item:bg-selected-hovered",
          className,
        ),
        children: (
          <>
            {icon ? (
              <span className="flex text-subtle group-highlighted:text-inherit group-aria-[current=page]:text-inherit">
                <Icon icon={icon} />
              </span>
            ) : null}
            <span className="min-w-0 truncate text-left">{children}</span>
          </>
        ),
      },
      props,
    ),
  });

export const NavItem = ({ menu, className, ...props }: NavItemProps) =>
  menu ? (
    <ContextMenu.Root>
      <div className="group/nav-item relative">
        <ContextMenu.Trigger render={<NavItemControl className={cn("pr-8", className)} {...props} />} />
        <div className="absolute inset-y-0 right-1 flex items-center opacity-0 group-focus-within/nav-item:opacity-100 group-hover/nav-item:opacity-100 group-has-data-[popup-open]/nav-item:opacity-100">
          <Menu.Root>
            <Menu.Trigger
              render={
                <IconButton icon={MoreHorizontalIcon} label={menu.label} className="size-6 rounded-md" />
              }
            />
            <Menu.Popup>{menu.items}</Menu.Popup>
          </Menu.Root>
        </div>
      </div>
      <ContextMenu.Popup>{menu.items}</ContextMenu.Popup>
    </ContextMenu.Root>
  ) : (
    <NavItemControl className={className} {...props} />
  );
