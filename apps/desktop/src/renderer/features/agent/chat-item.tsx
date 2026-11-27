import { Delete02Icon, MoreHorizontalIcon, PencilEdit02Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { Chat } from "@starlight/client";
import { ConfirmDialog, ContextMenu, IconButton, Menu, NavItem } from "@starlight/ui";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useStarlight } from "#renderer/lib/context.ts";

export const ChatItem = ({ chat: { id, title } }: { readonly chat: Chat }) => {
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { mutations } = useStarlight();
  const rename = useMutation(mutations.renameChat());
  const remove = useMutation(mutations.deleteChat());
  const navigate = useNavigate();
  const { chatId } = useParams({ strict: false });

  const commit = (next: string) => {
    setRenaming(false);
    const trimmed = next.trim();
    if (trimmed !== "" && trimmed !== title) rename.mutate({ chatId: id, title: trimmed });
  };

  if (renaming) {
    return (
      <input
        autoFocus
        defaultValue={title}
        aria-label="Chat title"
        onFocus={(event) => event.currentTarget.select()}
        onBlur={(event) => commit(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") setRenaming(false);
        }}
        className="h-8 w-full rounded-md bg-neutral px-2 text-base outline-none focus-ring"
      />
    );
  }

  const actions = (
    <>
      <Menu.Item icon={PencilEdit02Icon} onClick={() => setRenaming(true)}>
        Rename
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
              render={<Link to="/agent/$chatId" params={{ chatId: id }} />}
              actions={
                <Menu.Root>
                  <Menu.Trigger
                    render={
                      <IconButton
                        icon={MoreHorizontalIcon}
                        label="Chat actions"
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
          {title}
        </ContextMenu.Trigger>
        <ContextMenu.Popup>{actions}</ContextMenu.Popup>
      </ContextMenu.Root>
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        action="Delete chat"
        subject={title}
        message="The chat and its replies are deleted for good."
        icon={Delete02Icon}
        onConfirm={() =>
          remove.mutate(id, {
            onSuccess: () => {
              if (chatId === id) void navigate({ to: "/agent" });
            },
          })
        }
      />
    </>
  );
};
