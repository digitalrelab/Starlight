import type { ReactNode } from "react";
import { Sidebar } from "./sidebar.tsx";

export const AppShell = ({ children }: { readonly children: ReactNode }) => (
  <div className="flex h-full">
    <Sidebar />
    <main className="flex min-w-0 flex-1 flex-col py-2 pr-2">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-panel shadow-xs">
        {children}
      </div>
    </main>
  </div>
);
