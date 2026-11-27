import {
  BubbleChatIcon,
  Delete02Icon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
} from "@hugeicons-pro/core-stroke-rounded";
import type { Conversation } from "@starlight/client";
import { ConfirmDialog, IconButton, Menu, NavItem } from "@starlight/ui";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useStarlight } from "../../lib/context.ts";

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

  return (
    <div className="group/conversation relative">
      <NavItem
        icon={BubbleChatIcon}
        className="pr-8"
        render={<Link to="/agent/$conversationId" params={{ conversationId: id }} />}
      >
        {title}
      </NavItem>
      <Menu.Root>
        <Menu.Trigger
          render={
            <IconButton
              icon={MoreHorizontalIcon}
              label="Conversation actions"
              className="absolute top-0 right-0 size-8 rounded-md opacity-0 group-hover/conversation:opacity-100 focus-visible:opacity-100 data-[popup-open]:opacity-100"
            />
          }
        />
        <Menu.Popup>
          <Menu.Item icon={PencilEdit02Icon} onClick={() => setRenaming(true)}>
            Rename
          </Menu.Item>
          <Menu.Item icon={Delete02Icon} tone="danger" onClick={() => setDeleting(true)}>
            Delete
          </Menu.Item>
        </Menu.Popup>
      </Menu.Root>
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete conversation?"
        description={`“${title}” and its history will be removed.`}
        confirmLabel="Delete"
        onConfirm={() =>
          remove.mutate(id, {
            onSuccess: () => {
              setDeleting(false);
              if (conversationId === id) void navigate({ to: "/agent" });
            },
          })
        }
      />
    </div>
  );
};
