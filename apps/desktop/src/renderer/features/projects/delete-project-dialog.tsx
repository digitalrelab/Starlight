import { Delete02Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { Project } from "@starlight/client";
import { ConfirmDialog } from "@starlight/ui";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useStarlight } from "#renderer/lib/context.ts";

interface Props {
  readonly project: Project;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export const DeleteProjectDialog = ({ project, open, onOpenChange }: Props) => {
  const { mutations } = useStarlight();
  const remove = useMutation(mutations.deleteProject());
  const navigate = useNavigate();
  const { projectId } = useParams({ strict: false });

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      action="Delete project"
      subject={project.name}
      message="Its folders and files stay where they are."
      icon={Delete02Icon}
      onConfirm={async () => {
        if (projectId === project.id) await navigate({ to: "/" });
        remove.mutate(project.id);
      }}
    />
  );
};
