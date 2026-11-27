import type { ReactNode } from "react";

interface Props {
  readonly sidebar: ReactNode;
  readonly footer?: ReactNode;
  readonly children: ReactNode;
}

export const AppShell = ({ sidebar, footer, children }: Props) => (
  <div className="flex h-full">
    <aside className="flex w-60 shrink-0 flex-col">
      <div className="h-11 shrink-0 app-drag" />
      <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 pb-2">{sidebar}</nav>
      {footer ? <footer className="flex shrink-0 items-center gap-1 px-2 pb-2">{footer}</footer> : null}
    </aside>
    <main className="my-2 mr-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-default bg-surface shadow-xs">
      {children}
    </main>
  </div>
);
