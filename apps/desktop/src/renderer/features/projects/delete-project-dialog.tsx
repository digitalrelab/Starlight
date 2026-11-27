import { Delete02Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { Project } from "@starlight/client";
import { ConfirmDialog } from "@starlight/ui";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useStarlight } from "#renderer/lib/context.ts";
import { byRecentUse, forgetProject, projectDestination } from "./project-memory.ts";

interface Props {
  readonly project: Project;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export const DeleteProjectDialog = ({ project, open, onOpenChange }: Props) => {
  const { queries, mutations, queryClient } = useStarlight();
  const remove = useMutation(mutations.deleteProject());
  const navigate = useNavigate();
  const { projectId } = useParams({ strict: false });

  const onConfirm = async () => {
    forgetProject(project.id);
    if (projectId !== project.id) return remove.mutate(project.id);
    const projects = await queryClient.ensureQueryData(queries.projects());
    const [next] = byRecentUse(projects.filter(({ id }) => id !== project.id));
    if (!next) return remove.mutate(project.id, { onSuccess: () => navigate({ to: "/" }) });
    await navigate(projectDestination(next.id));
    remove.mutate(project.id);
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      action="Delete project"
      subject={project.name}
      message="Its folders and files stay where they are, and its chats move to Agent."
      icon={Delete02Icon}
      onConfirm={() => void onConfirm()}
    />
  );
};
