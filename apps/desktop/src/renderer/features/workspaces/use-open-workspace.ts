import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useStarlight } from "../../lib/context.ts";

export const useOpenWorkspace = () => {
  const { mutations } = useStarlight();
  const navigate = useNavigate();
  const pick = useMutation(mutations.pickDirectory());
  const open = useMutation(mutations.openWorkspace());

  return {
    run: () =>
      pick.mutate(undefined, {
        onSuccess: (path) => {
          if (path === null) return;
          open.mutate(path, {
            onSuccess: (workspace) =>
              navigate({
                to: "/w/$workspaceId",
                params: { workspaceId: workspace.id },
                search: { path: "" },
              }),
          });
        },
      }),
    pending: pick.isPending || open.isPending,
    error: pick.error ?? open.error,
  };
};
