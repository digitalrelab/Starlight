import {
  FolderAddIcon,
  FolderIcon,
  Settings02Icon,
  Tick02Icon,
  UnfoldMoreIcon,
} from "@hugeicons-pro/core-stroke-rounded";
import type { Project } from "@starlight/client";
import { Icon, Menu } from "@starlight/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Channel } from "#shared/channels.ts";
import { useStarlight } from "#renderer/lib/context.ts";
import { onMainMessage } from "#renderer/lib/main-messages.ts";
import { byRecency, projectDestination } from "./project-memory.ts";
import { useCreateProject } from "./use-create-project.ts";

export const ProjectSwitcher = ({ project }: { readonly project: Project | undefined }) => {
  const { queries } = useStarlight();
  const { data: projects } = useSuspenseQuery(queries.projects());
  const [open, setOpen] = useState(false);
  const createProject = useCreateProject();
  const navigate = useNavigate();
  const router = useRouter();

  useEffect(() => onMainMessage(Channel.projectSwitcher, () => setOpen((current) => !current)), []);

  return (
    <div className="flex flex-col gap-1">
      <Menu.Root
        open={open}
        onOpenChange={setOpen}
        onItemHighlighted={(item) => {
          const projectId = item?.dataset["projectId"];
          if (projectId) void router.preloadRoute(projectDestination(projectId));
        }}
      >
        <Menu.Trigger className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-base text-default focus-ring highlighted:bg-neutral-subtle-hovered">
          <Icon icon={FolderIcon} className="shrink-0 text-subtle" />
          <span className="min-w-0 flex-1 truncate">{project?.name ?? "Choose a project"}</span>
          <Icon icon={UnfoldMoreIcon} size={14} className="shrink-0 text-subtlest" />
        </Menu.Trigger>
        <Menu.Popup className="w-(--anchor-width)">
          {byRecency(projects).map((candidate) => (
            <Menu.Item
              key={candidate.id}
              icon={FolderIcon}
              data-project-id={candidate.id}
              onClick={() => void navigate(projectDestination(candidate.id))}
            >
              <span className="min-w-0 flex-1 truncate">{candidate.name}</span>
              {candidate.id === project?.id ? (
                <Icon icon={Tick02Icon} size={14} className="shrink-0" />
              ) : null}
            </Menu.Item>
          ))}
          <Menu.Separator />
          {project ? (
            <Menu.Item
              icon={Settings02Icon}
              onClick={() =>
                void navigate({ to: "/p/$projectId/settings", params: { projectId: project.id } })
              }
            >
              Project Settings
            </Menu.Item>
          ) : null}
          <Menu.Item icon={FolderAddIcon} onClick={createProject.run} disabled={createProject.pending}>
            New Project…
          </Menu.Item>
        </Menu.Popup>
      </Menu.Root>
      {createProject.error ? <p className="px-2 text-sm text-danger">{createProject.error.message}</p> : null}
    </div>
  );
};
