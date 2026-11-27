import { useRender } from "@base-ui/react/use-render";
import { cn } from "cn";
import type { ComponentProps } from "react";

const List = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    className={cn(
      "flex flex-col divide-y divide-default overflow-hidden rounded-lg border border-default bg-surface-raised px-4 shadow-xs",
      className,
    )}
    {...props}
  />
);

const Root = ({ render, className, ...props }: useRender.ComponentProps<"div">) =>
  useRender({
    defaultTagName: "div",
    render,
    props: { ...props, className: cn("flex min-h-16 items-center justify-between gap-6 py-3", className) },
  });

const Main = ({ className, ...props }: ComponentProps<"div">) => (
  <div className={cn("mr-auto flex min-w-0 items-center gap-3", className)} {...props} />
);

const Media = ({ className, ...props }: ComponentProps<"div">) => (
  <div className={cn("flex shrink-0 items-center", className)} {...props} />
);

const Content = ({ className, ...props }: ComponentProps<"div">) => (
  <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", className)} {...props} />
);

const Title = ({ htmlFor, ...props }: ComponentProps<"label">) =>
  htmlFor ? <label htmlFor={htmlFor} {...props} /> : <span {...props} />;

const Description = ({ className, ...props }: ComponentProps<"p">) => (
  <p className={cn("text-sm text-subtle", className)} {...props} />
);

export const Item = { List, Root, Main, Media, Content, Title, Description };
