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
          "flex h-7 w-full items-center gap-2 rounded-md px-2 text-[13px] text-muted outline-none",
          "hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-accent/60",
          "disabled:opacity-50 aria-[current=page]:bg-selected aria-[current=page]:text-fg",
          className,
        ),
      },
      props,
    ),
  });
