import { OpenWorkspaceButton } from "../workspaces/open-workspace-button.tsx";
import { WorkspaceNav } from "../workspaces/workspace-nav.tsx";
import { navItem } from "./nav-item.ts";

export const Sidebar = () => (
  <aside className="flex w-60 shrink-0 flex-col">
    <div className="h-11 shrink-0 [-webkit-app-region:drag]" />
    <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 pb-2">
      <OpenWorkspaceButton className={navItem} />
      <WorkspaceNav />
    </nav>
  </aside>
);
