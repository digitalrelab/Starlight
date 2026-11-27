import { Delete02Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { Workspace } from "@starlight/client";
import { ConfirmDialog } from "@starlight/ui";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useStarlight } from "#renderer/lib/context.ts";

interface Props {
  readonly workspace: Workspace;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export const DeleteWorkspaceDialog = ({ workspace, open, onOpenChange }: Props) => {
  const { mutations } = useStarlight();
  const remove = useMutation(mutations.deleteWorkspace());
  const navigate = useNavigate();
  const { workspaceId } = useParams({ strict: false });

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      action="Delete workspace"
      subject={workspace.name}
      message="Its folders and files stay where they are."
      icon={Delete02Icon}
      onConfirm={async () => {
        if (workspaceId === workspace.id) await navigate({ to: "/" });
        remove.mutate(workspace.id);
      }}
    />
  );
};
