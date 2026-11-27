import type { ReactNode } from "react";
import { HistoryControls } from "#renderer/features/history/history-controls.tsx";

interface Props {
  readonly children?: ReactNode;
  readonly actions?: ReactNode;
}

export const PageHeader = ({ children, actions }: Props) => (
  <header className="flex h-titlebar shrink-0 items-center gap-3 border-b border-default px-3 app-drag">
    <div className="flex min-w-0 items-center gap-2 app-no-drag">
      <HistoryControls />
      {children}
    </div>
    {actions ? <div className="ml-auto flex shrink-0 items-center gap-1 app-no-drag">{actions}</div> : null}
  </header>
);
