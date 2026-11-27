import {
  Delete02Icon,
  FolderIcon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
  Settings02Icon,
} from "@hugeicons-pro/core-stroke-rounded";
import type { Workspace } from "@starlight/client";
import { ContextMenu, IconButton, Menu, NavItem, RenameInput } from "@starlight/ui";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DeleteWorkspaceDialog } from "./delete-workspace-dialog.tsx";
import { useRenameWorkspace } from "./use-rename-workspace.ts";

export const WorkspaceItem = ({ workspace }: { readonly workspace: Workspace }) => {
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const rename = useRenameWorkspace(workspace.id);
  const navigate = useNavigate();
  const params = { workspaceId: workspace.id };

  if (renaming) {
    return (
      <RenameInput
        autoFocus
        value={workspace.name}
        aria-label="Workspace name"
        onRename={rename}
        onClose={() => setRenaming(false)}
      />
    );
  }

  const actions = (
    <>
      <Menu.Item icon={PencilEdit02Icon} onClick={() => setRenaming(true)}>
        Rename
      </Menu.Item>
      <Menu.Item
        icon={Settings02Icon}
        onClick={() => void navigate({ to: "/w/$workspaceId/settings", params })}
      >
        Settings
      </Menu.Item>
      <Menu.Separator />
      <Menu.Item icon={Delete02Icon} onClick={() => setDeleting(true)}>
        Delete
      </Menu.Item>
    </>
  );

  return (
    <>
      <ContextMenu.Root>
        <ContextMenu.Trigger
          render={
            <NavItem
              icon={FolderIcon}
              render={<Link to="/w/$workspaceId" params={params} activeOptions={{ includeSearch: false }} />}
              actions={
                <Menu.Root>
                  <Menu.Trigger
                    render={
                      <IconButton
                        icon={MoreHorizontalIcon}
                        label="Workspace actions"
                        className="size-6 rounded-md"
                      />
                    }
                  />
                  <Menu.Popup>{actions}</Menu.Popup>
                </Menu.Root>
              }
            />
          }
        >
          {workspace.name}
        </ContextMenu.Trigger>
        <ContextMenu.Popup>{actions}</ContextMenu.Popup>
      </ContextMenu.Root>
      <DeleteWorkspaceDialog workspace={workspace} open={deleting} onOpenChange={setDeleting} />
    </>
  );
};
