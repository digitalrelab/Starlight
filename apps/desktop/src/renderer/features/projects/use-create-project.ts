import { useNavigate } from "@tanstack/react-router";
import { useStarlight } from "#renderer/lib/context.ts";
import { useFolderAction } from "./use-folder-action.ts";

export const useCreateProject = () => {
  const { mutations } = useStarlight();
  const navigate = useNavigate();
  return useFolderAction(mutations.createProject(), (project) =>
    navigate({ to: "/p/$projectId", params: { projectId: project.id } }),
  );
};
