import type { ReactNode } from "react";

/** Draggable window chrome. Leaves room for macOS traffic lights. */
export const TitleBar = ({ children }: { readonly children?: ReactNode }) => (
  <header className="flex h-11 shrink-0 items-center border-b border-border pr-3 pl-20 [-webkit-app-region:drag]">
    <div className="flex min-w-0 items-center [-webkit-app-region:no-drag]">{children}</div>
  </header>
);
