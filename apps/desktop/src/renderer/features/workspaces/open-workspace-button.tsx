import { FolderOpenIcon } from "@hugeicons-pro/core-stroke-rounded";
import { Button, type ButtonProps, Icon } from "@starlight/ui";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useStarlight } from "../../lib/context.ts";

type Props = Pick<ButtonProps, "variant" | "className">;

export const OpenWorkspaceButton = ({ variant, className }: Props) => {
  const { mutations } = useStarlight();
  const navigate = useNavigate();
  const pick = useMutation(mutations.pickDirectory());
  const open = useMutation(mutations.openWorkspace());
  const error = pick.error ?? open.error;

  const onClick = () =>
    pick.mutate(undefined, {
      onSuccess: (path) => {
        if (path === null) return;
        open.mutate(path, {
          onSuccess: (workspace) =>
            navigate({ to: "/w/$workspaceId", params: { workspaceId: workspace.id }, search: { path: "" } }),
        });
      },
    });

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant={variant}
        className={className}
        disabled={pick.isPending || open.isPending}
        onClick={onClick}
      >
        <Icon icon={FolderOpenIcon} />
        Open Folder…
      </Button>
      {error ? <p className="px-2 text-[12px] text-danger">{error.message}</p> : null}
    </div>
  );
};
