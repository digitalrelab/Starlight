import { FolderOpenIcon, Settings01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { Icon, IconButton, NavItem } from "@starlight/ui";
import { Link } from "@tanstack/react-router";
import { UpdateButton } from "../updates/update-button.tsx";
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
    </>
  );
};

export const MainSidebarFooter = () => (
  <>
    <IconButton icon={Settings01Icon} label="Settings" render={<Link to="/settings" />} />
    <UpdateButton className="ml-auto" />
  </>
);
