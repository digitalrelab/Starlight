import { FolderAddIcon, Navigation03Icon, Settings01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { IconButton, NavItem } from "@starlight/ui";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { UpdateButton } from "#renderer/features/updates/update-button.tsx";
import { useCreateProject } from "#renderer/features/projects/use-create-project.ts";
import { ProjectList } from "#renderer/features/projects/project-list.tsx";
import { AppShell } from "./app-shell.tsx";

const MainSidebar = ({ activeProjectId }: { readonly activeProjectId: string | null }) => {
  const createProject = useCreateProject();

  return (
    <>
      <div className="flex flex-col gap-1">
        <NavItem icon={Navigation03Icon} render={<Link to="/agent" />}>
          Agent
        </NavItem>
        <NavItem icon={FolderAddIcon} onClick={createProject.run} disabled={createProject.pending}>
          New Project…
        </NavItem>
        {createProject.error ? (
          <p className="px-2 text-sm text-danger">{createProject.error.message}</p>
        ) : null}
      </div>
      <ProjectList activeProjectId={activeProjectId} />
    </>
  );
};

const MainSidebarFooter = () => (
  <>
    <IconButton icon={Settings01Icon} label="Settings" render={<Link to="/settings" />} />
    <UpdateButton className="ml-auto" />
  </>
);

interface Props {
  readonly activeProjectId: string | null;
  readonly children: ReactNode;
}

export const MainShell = ({ activeProjectId, children }: Props) => (
  <AppShell sidebar={<MainSidebar activeProjectId={activeProjectId} />} footer={<MainSidebarFooter />}>
    {children}
  </AppShell>
);
