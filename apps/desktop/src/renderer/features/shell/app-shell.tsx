import { Card, ScrollArea } from "@starlight/ui";
import type { ReactNode } from "react";

interface Props {
  readonly sidebar: ReactNode;
  readonly footer?: ReactNode;
  readonly children: ReactNode;
}

export const AppShell = ({ sidebar, footer, children }: Props) => (
  <div className="flex h-full">
    <aside className="flex w-60 shrink-0 flex-col">
      <div className="h-titlebar shrink-0 app-drag" />
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-4 px-2 pb-2">{sidebar}</nav>
      </ScrollArea>
      {footer ? <footer className="flex shrink-0 items-center gap-1 px-2 pb-2">{footer}</footer> : null}
    </aside>
    <Card
      surface="panel"
      render={<main />}
      className="my-2 mr-2 flex min-w-0 flex-1 flex-col overflow-hidden"
    >
      {children}
    </Card>
  </div>
);
