import { mergeProps, useRender } from "@base-ui/react";
import { cn } from "cn";

const surfaces = {
  base: "bg-surface",
  raised: "bg-surface-raised shadow-xs",
  lifted: "bg-surface-overlay shadow-lifted",
} as const;

export interface CardProps extends useRender.ComponentProps<"div"> {
  readonly surface?: keyof typeof surfaces;
}

export const Card = ({ surface = "raised", className, render, ...props }: CardProps) =>
  useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      { className: cn("rounded-lg border border-default", surfaces[surface], className) },
      props,
    ),
  });
