import type { Chat } from "@starlight/client";
import { linkOptions } from "@tanstack/react-router";

export const newChatLink = (projectId: string | null) =>
  projectId === null
    ? linkOptions({ to: "/agent" })
    : linkOptions({ to: "/p/$projectId/chats", params: { projectId } });

export const chatLink = ({ id }: Pick<Chat, "id">) =>
  linkOptions({ to: "/chats/$chatId", params: { chatId: id } });
