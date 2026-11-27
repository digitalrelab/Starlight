import { useMutation } from "@tanstack/react-query";
import { useStarlight } from "#renderer/lib/context.ts";

export const useRenameWorkspace = (workspaceId: string) => {
  const { mutations } = useStarlight();
  const rename = useMutation(mutations.renameWorkspace());
  return (name: string) => rename.mutate({ workspaceId, name });
};
