import { FolderOpenIcon } from "@hugeicons-pro/core-stroke-rounded";
import { Icon, NavItem } from "@starlight/ui";
import { UpdateNotice } from "../updates/update-notice.tsx";
import { RecentWorkspaces } from "../workspaces/recent-workspaces.tsx";
import { useOpenWorkspace } from "../workspaces/use-open-workspace.ts";

export const Sidebar = () => {
  const openWorkspace = useOpenWorkspace();

  return (
    <aside className="flex w-60 shrink-0 flex-col">
      <div className="h-11 shrink-0 app-drag" />
      <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 pb-2">
        <div className="flex flex-col gap-1">
          <NavItem onClick={openWorkspace.run} disabled={openWorkspace.pending}>
            <Icon icon={FolderOpenIcon} className="shrink-0" />
            Open Folder…
          </NavItem>
          {openWorkspace.error ? (
            <p className="px-2 text-[12px] text-danger">{openWorkspace.error.message}</p>
          ) : null}
        </div>
        <RecentWorkspaces />
      </nav>
      <footer className="shrink-0 px-2 pb-2 empty:hidden">
        <UpdateNotice />
      </footer>
    </aside>
  );
};
