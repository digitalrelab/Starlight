import type { IconSvgElement } from "@hugeicons/react";
import { mergeProps, useRender } from "@base-ui/react";
import { cn } from "cn";
import { Icon } from "./icon.tsx";

export interface NavItemProps extends useRender.ComponentProps<"button"> {
  readonly icon?: IconSvgElement | undefined;
}

export const NavItem = ({ icon, render, className, children, ...props }: NavItemProps) =>
  useRender({
    render,
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "group flex h-8 w-full items-center gap-2 rounded-md px-2 text-base text-default focus-ring",
          "highlighted:bg-neutral-subtle-hovered disabled:opacity-50",
          "aria-[current=page]:bg-selected aria-[current=page]:text-selected aria-[current=page]:highlighted:bg-selected-hovered",
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
