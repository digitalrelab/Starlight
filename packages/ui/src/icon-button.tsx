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
          "inline-flex size-7 items-center justify-center rounded-md text-muted focus-ring",
          "hover:bg-hover hover:text-fg aria-[current=page]:text-fg",
          className,
        ),
        children: <Icon icon={icon} />,
      },
      props,
    ),
  });
  return <Tooltip label={label}>{element}</Tooltip>;
};
