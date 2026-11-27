import type { ReactNode } from "react";

export const PageHeader = ({ children }: { readonly children?: ReactNode }) => (
  <header className="flex h-titlebar shrink-0 items-center border-b border-default px-3 app-drag">
    <div className="flex min-w-0 items-center app-no-drag">{children}</div>
  </header>
);
