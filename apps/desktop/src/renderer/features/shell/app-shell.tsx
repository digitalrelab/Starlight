import { ScrollArea } from "@starlight/ui";
import { type ReactNode, useState } from "react";
import { ShellAsideSlot } from "./shell-aside.tsx";

interface Props {
  readonly sidebar: ReactNode;
  readonly footer?: ReactNode;
  readonly children: ReactNode;
}

export const AppShell = ({ sidebar, footer, children }: Props) => {
  const [aside, setAside] = useState<HTMLElement | null>(null);
  return (
    <div className="flex h-full">
      <aside className="flex w-60 shrink-0 flex-col">
        <div className="h-titlebar shrink-0 app-drag" />
        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-4 px-2 pb-2">{sidebar}</nav>
        </ScrollArea>
        {footer ? <footer className="flex shrink-0 items-center gap-1 px-2 pb-2">{footer}</footer> : null}
      </aside>
      <main className="my-2 mr-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg bg-surface shadow-lifted">
        <ShellAsideSlot value={aside}>{children}</ShellAsideSlot>
      </main>
      <div ref={setAside} className="flex shrink-0 empty:hidden" />
    </div>
  );
};
