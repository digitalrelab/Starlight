import {
  Delete02Icon,
  FolderIcon,
  PencilEdit02Icon,
  Settings02Icon,
} from "@hugeicons-pro/core-stroke-rounded";
import type { Project } from "@starlight/client";
import { Menu, NavItem, RenameInput } from "@starlight/ui";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { DeleteProjectDialog } from "./delete-project-dialog.tsx";
import { ProjectChats } from "./project-chats.tsx";
import { useRenameProject } from "./use-rename-project.ts";

export const ProjectItem = ({ project }: { readonly project: Project }) => {
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const rename = useRenameProject(project.id);
  const navigate = useNavigate();
  const params = { projectId: project.id };
  const active = useParams({ strict: false }).projectId === project.id;

  if (renaming) {
    return (
      <RenameInput
        autoFocus
        value={project.name}
        aria-label="Project name"
        onRename={rename}
        onClose={() => setRenaming(false)}
      />
    );
  }

  const items = (
    <>
      <Menu.Item icon={PencilEdit02Icon} onClick={() => setRenaming(true)}>
        Rename
      </Menu.Item>
      <Menu.Item
        icon={Settings02Icon}
        onClick={() => void navigate({ to: "/p/$projectId/settings", params })}
      >
        Settings
      </Menu.Item>
      <Menu.Separator />
      <Menu.Item icon={Delete02Icon} onClick={() => setDeleting(true)}>
        Delete
      </Menu.Item>
    </>
  );

  return (
    <>
      <NavItem
        icon={FolderIcon}
        render={<Link to="/p/$projectId" params={params} activeOptions={{ includeSearch: false }} />}
        menu={{ label: "Project actions", items }}
      >
        {project.name}
      </NavItem>
      {active ? <ProjectChats projectId={project.id} /> : null}
      <DeleteProjectDialog project={project} open={deleting} onOpenChange={setDeleting} />
    </>
  );
};
