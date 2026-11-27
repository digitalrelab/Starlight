import type { Chat } from "@starlight/client";
import { linkOptions } from "@tanstack/react-router";

export const newChatLink = (projectId: string | null) =>
  projectId === null
    ? linkOptions({ to: "/agent" })
    : linkOptions({ to: "/p/$projectId/chats", params: { projectId } });

export const chatLink = ({ id, projectId }: Pick<Chat, "id" | "projectId">) =>
  projectId === null
    ? linkOptions({ to: "/agent/$chatId", params: { chatId: id } })
    : linkOptions({ to: "/p/$projectId/chats/$chatId", params: { projectId, chatId: id } });
