import type { ReactNode } from "react";

interface Props {
  readonly children?: ReactNode;
  readonly actions?: ReactNode;
}

export const PageHeader = ({ children, actions }: Props) => (
  <header className="flex h-11 shrink-0 items-center gap-3 border-b border-border px-3 app-drag">
    <div className="flex min-w-0 items-center app-no-drag">{children}</div>
    {actions ? <div className="ml-auto flex shrink-0 items-center gap-1 app-no-drag">{actions}</div> : null}
  </header>
);
