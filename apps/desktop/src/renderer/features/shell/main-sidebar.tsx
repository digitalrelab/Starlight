import { FolderOpenIcon, Settings01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { Icon, NavItem } from "@starlight/ui";
import { Link } from "@tanstack/react-router";
import { RecentWorkspaces } from "../workspaces/recent-workspaces.tsx";
import { useOpenWorkspace } from "../workspaces/use-open-workspace.ts";

export const MainSidebar = () => {
  const openWorkspace = useOpenWorkspace();

  return (
    <>
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
      <NavItem className="mt-auto" render={<Link to="/settings" />}>
        <Icon icon={Settings01Icon} className="shrink-0" />
        Settings
      </NavItem>
    </>
  );
};
