import { FolderAddIcon } from "@hugeicons-pro/core-stroke-rounded";
import { IconButton } from "@starlight/ui";
import { useStarlight } from "#renderer/lib/context.ts";
import { useFolderAction } from "./use-folder-action.ts";

export const AddMountButton = ({ workspaceId }: { readonly workspaceId: string }) => {
  const { mutations } = useStarlight();
  const addMount = useFolderAction(mutations.addMount(workspaceId));
  return (
    <IconButton icon={FolderAddIcon} label="Add Folder…" onClick={addMount.run} disabled={addMount.pending} />
  );
};
