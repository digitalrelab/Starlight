import { mergeProps, useRender } from "@base-ui/react";
import { cn } from "cn";

const surfaces = {
  raised: "border border-default bg-surface-raised shadow-xs",
  panel: "bg-surface shadow-lifted",
} as const;

export interface CardProps extends useRender.ComponentProps<"div"> {
  readonly surface?: keyof typeof surfaces | undefined;
}

export const Card = ({ surface = "raised", className, render, ...props }: CardProps) =>
  useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">({ className: cn("rounded-lg", surfaces[surface], className) }, props),
  });
