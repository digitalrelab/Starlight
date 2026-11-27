import { Delete02Icon, FolderAddIcon, FolderIcon, Remove01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { entryKey, type Project } from "@starlight/client";
import { Button, Icon, IconButton, Item, RenameInput } from "@starlight/ui";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useStarlight } from "#renderer/lib/context.ts";
import { DeleteProjectDialog } from "./delete-project-dialog.tsx";
import { useFolderAction } from "./use-folder-action.ts";
import { useRenameProject } from "./use-rename-project.ts";

const Folders = ({ project }: { readonly project: Project }) => {
  const { mutations } = useStarlight();
  const add = useFolderAction(mutations.addMount(project.id));
  const remove = useMutation(mutations.removeMount(project.id));

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
      {project.mounts.map((mount) => (
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

export const ProjectSettings = ({ project }: { readonly project: Project }) => {
  const rename = useRenameProject(project.id);
  const [deleting, setDeleting] = useState(false);

  return (
    <>
      <Item.List>
        <Item.Root>
          <Item.Content>
            <Item.Title htmlFor="project-name">Name</Item.Title>
            <Item.Description>Shown in the sidebar</Item.Description>
          </Item.Content>
          <RenameInput
            key={project.name}
            id="project-name"
            value={project.name}
            onRename={rename}
            className="max-w-64"
          />
        </Item.Root>
      </Item.List>
      <Folders project={project} />
      <Item.List>
        <Item.Root>
          <Item.Content>
            <Item.Title>Delete project</Item.Title>
            <Item.Description>Its folders and files stay where they are</Item.Description>
          </Item.Content>
          <Button intent="secondary" onClick={() => setDeleting(true)}>
            <Icon icon={Delete02Icon} />
            Delete…
          </Button>
        </Item.Root>
      </Item.List>
      <DeleteProjectDialog project={project} open={deleting} onOpenChange={setDeleting} />
    </>
  );
};
