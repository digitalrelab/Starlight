import { useNavigate } from "@tanstack/react-router";
import { useStarlight } from "#renderer/lib/context.ts";
import { useFolderAction } from "./use-folder-action.ts";

export const useCreateWorkspace = () => {
  const { mutations } = useStarlight();
  const navigate = useNavigate();
  return useFolderAction(mutations.createWorkspace(), (workspace) =>
    navigate({ to: "/w/$workspaceId", params: { workspaceId: workspace.id } }),
  );
};
