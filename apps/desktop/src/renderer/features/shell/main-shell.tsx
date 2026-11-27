import { FolderAddIcon, Navigation03Icon, Settings01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { IconButton, NavItem } from "@starlight/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { UpdateButton } from "#renderer/features/updates/update-button.tsx";
import { ProjectChats } from "#renderer/features/projects/project-chats.tsx";
import { ProjectSwitcher } from "#renderer/features/projects/project-switcher.tsx";
import { useCreateProject } from "#renderer/features/projects/use-create-project.ts";
import { useStarlight } from "#renderer/lib/context.ts";
import { AppShell } from "./app-shell.tsx";

const NewProject = () => {
  const createProject = useCreateProject();
  return (
    <div className="flex flex-col gap-1">
      <NavItem icon={FolderAddIcon} onClick={createProject.run} disabled={createProject.pending}>
        New Project…
      </NavItem>
      {createProject.error ? <p className="px-2 text-sm text-danger">{createProject.error.message}</p> : null}
    </div>
  );
};

const MainSidebar = ({ activeProjectId }: { readonly activeProjectId: string | null }) => {
  const { queries } = useStarlight();
  const { data: projects } = useSuspenseQuery(queries.projects());
  const project = projects.find(({ id }) => id === activeProjectId);

  if (projects.length === 0) return <NewProject />;

  return (
    <>
      <ProjectSwitcher project={project} />
      {project ? <ProjectChats projectId={project.id} /> : null}
    </>
  );
};

const MainSidebarFooter = () => (
  <>
    <IconButton icon={Settings01Icon} label="Settings" render={<Link to="/settings" />} />
    <IconButton icon={Navigation03Icon} label="Agent" render={<Link to="/agent" />} />
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
