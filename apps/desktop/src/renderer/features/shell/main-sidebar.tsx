import { FolderAddIcon, Navigation03Icon, Settings01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { IconButton, NavItem } from "@starlight/ui";
import { Link } from "@tanstack/react-router";
import { UpdateButton } from "#renderer/features/updates/update-button.tsx";
import { useCreateWorkspace } from "#renderer/features/workspaces/use-create-workspace.ts";
import { WorkspaceList } from "#renderer/features/workspaces/workspace-list.tsx";

export const MainSidebar = () => {
  const createWorkspace = useCreateWorkspace();

  return (
    <>
      <div className="flex flex-col gap-1">
        <NavItem icon={Navigation03Icon} render={<Link to="/agent" />}>
          Agent
        </NavItem>
        <NavItem icon={FolderAddIcon} onClick={createWorkspace.run} disabled={createWorkspace.pending}>
          New Workspace…
        </NavItem>
        {createWorkspace.error ? (
          <p className="px-2 text-sm text-danger">{createWorkspace.error.message}</p>
        ) : null}
      </div>
      <WorkspaceList />
    </>
  );
};

export const MainSidebarFooter = () => (
  <>
    <IconButton icon={Settings01Icon} label="Settings" render={<Link to="/settings" />} />
    <UpdateButton className="ml-auto" />
  </>
);
