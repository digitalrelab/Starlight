import { Delete02Icon, PencilEdit02Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { Chat } from "@starlight/client";
import { ConfirmDialog, Menu, NavItem, RenameInput } from "@starlight/ui";
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

  if (renaming) {
    return (
      <RenameInput
        autoFocus
        value={title}
        aria-label="Chat title"
        onRename={(next) => rename.mutate({ chatId: id, title: next })}
        onClose={() => setRenaming(false)}
      />
    );
  }

  const items = (
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
      <NavItem
        render={<Link to="/agent/$chatId" params={{ chatId: id }} />}
        menu={{ label: "Chat actions", items }}
      >
        {title}
      </NavItem>
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        action="Delete chat"
        subject={title}
        message="The chat and its replies are deleted for good."
        icon={Delete02Icon}
        onConfirm={async () => {
          if (chatId === id) await navigate({ to: "/agent" });
          remove.mutate(id);
        }}
      />
    </>
  );
};
