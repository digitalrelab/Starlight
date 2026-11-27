import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "cn";

export type NavItemProps = useRender.ComponentProps<"button">;

export const NavItem = ({ render, className, ...props }: NavItemProps) =>
  useRender({
    render,
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "flex h-control w-full items-center gap-2 rounded-md px-2 text-base text-subtle focus-ring",
          "not-disabled:hover:bg-neutral-subtle-hovered not-disabled:hover:text-default",
          "data-[popup-open]:bg-neutral-subtle-hovered data-[popup-open]:text-default",
          "disabled:opacity-50 aria-[current=page]:bg-selected aria-[current=page]:text-default",
          className,
        ),
      },
      props,
    ),
  });
