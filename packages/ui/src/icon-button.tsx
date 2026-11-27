import type { IconSvgElement } from "@hugeicons/react";
import { mergeProps, useRender } from "@base-ui/react";
import { cn } from "cn";
import { Icon } from "./icon.tsx";
import type { Shortcut } from "./kbd.tsx";
import { Tooltip } from "./tooltip.tsx";

const sizes = { sm: "size-6", md: "size-control" } as const;

export interface IconButtonProps extends useRender.ComponentProps<"button"> {
  readonly icon: IconSvgElement;
  readonly pressedIcon?: IconSvgElement | undefined;
  readonly label: string;
  readonly shortcut?: Shortcut | undefined;
  readonly size?: keyof typeof sizes;
}

export const IconButton = ({
  icon,
  pressedIcon,
  label,
  shortcut,
  size = "md",
  render,
  className,
  ...props
}: IconButtonProps) => {
  const element = useRender({
    render,
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        "aria-label": label,
        className: cn(
          "inline-flex items-center justify-center rounded-full text-subtle focus-ring",
          sizes[size],
          "highlighted:bg-neutral-subtle-hovered highlighted:text-default aria-[current=page]:text-default",
          pressedIcon
            ? "aria-pressed:text-default"
            : "aria-pressed:bg-selected aria-pressed:text-selected aria-pressed:highlighted:bg-selected-hovered aria-pressed:highlighted:text-selected",
          className,
        ),
        children: <Icon icon={pressedIcon && props["aria-pressed"] === true ? pressedIcon : icon} />,
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
