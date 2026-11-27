import { FolderOpenIcon, Navigation03Icon, Settings01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { IconButton, NavItem } from "@starlight/ui";
import { Link } from "@tanstack/react-router";
import { UpdateButton } from "#renderer/features/updates/update-button.tsx";
import { RecentWorkspaces } from "#renderer/features/workspaces/recent-workspaces.tsx";
import { useOpenWorkspace } from "#renderer/features/workspaces/use-open-workspace.ts";

export const MainSidebar = () => {
  const openWorkspace = useOpenWorkspace();

  return (
    <>
      <div className="flex flex-col gap-1">
        <NavItem icon={Navigation03Icon} render={<Link to="/agent" />}>
          Agent
        </NavItem>
        <NavItem icon={FolderOpenIcon} onClick={openWorkspace.run} disabled={openWorkspace.pending}>
          Open Folder…
        </NavItem>
        {openWorkspace.error ? (
          <p className="px-2 text-sm text-danger">{openWorkspace.error.message}</p>
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
