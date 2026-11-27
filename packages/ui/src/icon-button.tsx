import type { IconSvgElement } from "@hugeicons/react";
import { mergeProps, useRender } from "@base-ui/react";
import { cn } from "cn";
import { Icon } from "./icon.tsx";
import type { Shortcut } from "./kbd.tsx";
import { Tooltip } from "./tooltip.tsx";

export interface IconButtonProps extends useRender.ComponentProps<"button"> {
  readonly icon: IconSvgElement;
  readonly label: string;
  readonly shortcut?: Shortcut | undefined;
}

export const IconButton = ({ icon, label, shortcut, render, className, ...props }: IconButtonProps) => {
  const element = useRender({
    render,
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        "aria-label": label,
        className: cn(
          "inline-flex size-control items-center justify-center rounded-full text-subtle focus-ring",
          "highlighted:bg-neutral-subtle-hovered highlighted:text-default aria-[current=page]:text-default",
          className,
        ),
        children: <Icon icon={icon} />,
      },
      props,
    ),
  });
  return (
    <Tooltip label={label} shortcut={shortcut}>
      {element}
    </Tooltip>
  );
};
