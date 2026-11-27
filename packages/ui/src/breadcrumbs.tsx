import { ArrowRight01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { mergeProps, useRender } from "@base-ui/react";
import { cn } from "cn";
import type { ReactNode } from "react";
import { Icon } from "./icon.tsx";

const Root = ({ children }: { readonly children: ReactNode }) => (
  <nav aria-label="Breadcrumbs" className="min-w-0">
    <ol className="flex items-center gap-0.5">{children}</ol>
  </nav>
);

const Item = ({ render, className, ...props }: useRender.ComponentProps<"a">) => {
  const element = useRender({
    render,
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn(
          "truncate rounded-sm px-1.5 py-0.5 text-subtle focus-ring hover:bg-neutral-subtle-hovered aria-[current=page]:text-default",
          className,
        ),
      },
      props,
    ),
  });
  return (
    <li className="group/crumb flex min-w-0 items-center gap-0.5">
      <Icon icon={ArrowRight01Icon} size={12} aria-hidden className="text-subtle group-first/crumb:hidden" />
      {element}
    </li>
  );
};

export const Breadcrumbs = { Root, Item };
