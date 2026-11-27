import { useNavigate } from "@tanstack/react-router";
import { useStarlight } from "#renderer/lib/context.ts";
import { useFolderAction } from "./use-folder-action.ts";

export const useOpenWorkspace = () => {
  const { mutations } = useStarlight();
  const navigate = useNavigate();
  return useFolderAction(mutations.openWorkspace(), (workspace) =>
    navigate({ to: "/w/$workspaceId", params: { workspaceId: workspace.id }, search: {} }),
  );
};
