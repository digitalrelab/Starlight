import { Delete02Icon, MoreHorizontalIcon, PencilEdit02Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { Conversation } from "@starlight/client";
import { ConfirmDialog, ContextMenu, IconButton, Menu, NavItem } from "@starlight/ui";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useStarlight } from "#renderer/lib/context.ts";

export const ConversationItem = ({
  conversation: { id, title },
}: {
  readonly conversation: Conversation;
}) => {
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { mutations } = useStarlight();
  const rename = useMutation(mutations.renameConversation());
  const remove = useMutation(mutations.deleteConversation());
  const navigate = useNavigate();
  const { conversationId } = useParams({ strict: false });

  const commit = (next: string) => {
    setRenaming(false);
    const trimmed = next.trim();
    if (trimmed !== "" && trimmed !== title) rename.mutate({ conversationId: id, title: trimmed });
  };

  if (renaming) {
    return (
      <input
        autoFocus
        defaultValue={title}
        aria-label="Conversation title"
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
              render={<Link to="/agent/$conversationId" params={{ conversationId: id }} />}
              actions={
                <Menu.Root>
                  <Menu.Trigger
                    render={
                      <IconButton
                        icon={MoreHorizontalIcon}
                        label="Conversation actions"
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
        action="Delete conversation"
        subject={title}
        message="The conversation and its replies are deleted for good."
        icon={Delete02Icon}
        onConfirm={() =>
          remove.mutate(id, {
            onSuccess: () => {
              if (conversationId === id) void navigate({ to: "/agent" });
            },
          })
        }
      />
    </>
  );
};
