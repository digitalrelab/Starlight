import { ScrollArea as BaseScrollArea } from "@base-ui/react";
import type { ReactNode } from "react";
import { cn } from "cn";

export interface ScrollAreaProps {
  readonly className?: string;
  readonly contentClassName?: string;
  readonly children: ReactNode;
}

export const ScrollArea = ({ className, contentClassName, children }: ScrollAreaProps) => (
  <BaseScrollArea.Root className={cn("relative flex min-h-0 flex-col", className)}>
    <BaseScrollArea.Viewport className="min-h-0 flex-1 overscroll-contain outline-none scroll-fade-y">
      <BaseScrollArea.Content className={contentClassName}>{children}</BaseScrollArea.Content>
    </BaseScrollArea.Viewport>
    <BaseScrollArea.Scrollbar
      orientation="vertical"
      className="m-1 flex w-1 justify-center opacity-0 transition-opacity data-[hovering]:opacity-100 data-[scrolling]:opacity-100"
    >
      <BaseScrollArea.Thumb className="w-full rounded-full bg-neutral-subtle-hovered" />
    </BaseScrollArea.Scrollbar>
  </BaseScrollArea.Root>
);
