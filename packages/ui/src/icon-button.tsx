import type { IconSvgElement } from "@hugeicons/react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "cn";
import { Icon } from "./icon.tsx";
import { Tooltip } from "./tooltip.tsx";

export interface IconButtonProps extends useRender.ComponentProps<"button"> {
  readonly icon: IconSvgElement;
  readonly label: string;
}

export const IconButton = ({ icon, label, render, className, ...props }: IconButtonProps) => {
  const element = useRender({
    render,
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        "aria-label": label,
        className: cn(
          "inline-flex size-control items-center justify-center rounded-md text-subtle focus-ring",
          "hover:bg-neutral-subtle-hovered hover:text-default aria-[current=page]:text-default",
          "data-[popup-open]:bg-neutral-subtle-hovered data-[popup-open]:text-default",
          className,
        ),
        children: <Icon icon={icon} />,
      },
      props,
    ),
  });
  return <Tooltip label={label}>{element}</Tooltip>;
};
