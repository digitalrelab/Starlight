import { Delete02Icon, FolderAddIcon, FolderIcon, Remove01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { entryKey, type Workspace } from "@starlight/client";
import { Button, Icon, IconButton, Item, RenameInput } from "@starlight/ui";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useStarlight } from "#renderer/lib/context.ts";
import { DeleteWorkspaceDialog } from "./delete-workspace-dialog.tsx";
import { useFolderAction } from "./use-folder-action.ts";
import { useRenameWorkspace } from "./use-rename-workspace.ts";

const Folders = ({ workspace }: { readonly workspace: Workspace }) => {
  const { mutations } = useStarlight();
  const add = useFolderAction(mutations.addMount(workspace.id));
  const remove = useMutation(mutations.removeMount(workspace.id));

  return (
    <Item.List>
      <Item.Root>
        <Item.Content>
          <Item.Title>Folders</Item.Title>
          <Item.Description>Removing a folder leaves its files where they are</Item.Description>
          {add.error ? <p className="text-sm text-danger">{add.error.message}</p> : null}
        </Item.Content>
        <Button intent="secondary" onClick={add.run} disabled={add.pending}>
          <Icon icon={FolderAddIcon} />
          Add Folder…
        </Button>
      </Item.Root>
      {workspace.mounts.map((mount) => (
        <Item.Root key={entryKey(mount.root)}>
          <Item.Main>
            <Item.Media>
              <Icon icon={FolderIcon} className="text-subtle" />
            </Item.Media>
            <Item.Content>
              <Item.Title>{mount.name}</Item.Title>
              <Item.Description className="truncate">{mount.root.id}</Item.Description>
            </Item.Content>
          </Item.Main>
          <IconButton
            icon={Remove01Icon}
            label={`Remove ${mount.name}`}
            disabled={remove.isPending}
            onClick={() => remove.mutate(mount.root)}
          />
        </Item.Root>
      ))}
    </Item.List>
  );
};

export const WorkspaceSettings = ({ workspace }: { readonly workspace: Workspace }) => {
  const rename = useRenameWorkspace(workspace.id);
  const [deleting, setDeleting] = useState(false);

  return (
    <>
      <Item.List>
        <Item.Root>
          <Item.Content>
            <Item.Title htmlFor="workspace-name">Name</Item.Title>
            <Item.Description>Shown in the sidebar</Item.Description>
          </Item.Content>
          <RenameInput
            key={workspace.name}
            id="workspace-name"
            value={workspace.name}
            onRename={rename}
            className="max-w-64"
          />
        </Item.Root>
      </Item.List>
      <Folders workspace={workspace} />
      <Item.List>
        <Item.Root>
          <Item.Content>
            <Item.Title>Delete workspace</Item.Title>
            <Item.Description>Its folders and files stay where they are</Item.Description>
          </Item.Content>
          <Button intent="secondary" onClick={() => setDeleting(true)}>
            <Icon icon={Delete02Icon} />
            Delete…
          </Button>
        </Item.Root>
      </Item.List>
      <DeleteWorkspaceDialog workspace={workspace} open={deleting} onOpenChange={setDeleting} />
    </>
  );
};
