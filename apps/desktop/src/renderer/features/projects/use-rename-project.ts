import { useMutation } from "@tanstack/react-query";
import { useStarlight } from "#renderer/lib/context.ts";

export const useRenameProject = (projectId: string) => {
  const { mutations } = useStarlight();
  const rename = useMutation(mutations.renameProject());
  return (name: string) => rename.mutate({ projectId, name });
};
