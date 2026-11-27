import type { ReactNode } from "react";

export const PageHeader = ({ children }: { readonly children?: ReactNode }) => (
  <header className="flex h-11 shrink-0 items-center border-b border-border px-3 [-webkit-app-region:drag]">
    <div className="flex min-w-0 items-center [-webkit-app-region:no-drag]">{children}</div>
  </header>
);
