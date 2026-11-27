import { MessageAdd01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { NavItem } from "@starlight/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChatItem } from "#renderer/features/agent/chat-item.tsx";
import { useStarlight } from "#renderer/lib/context.ts";

export const ProjectChats = ({ projectId }: { readonly projectId: string }) => {
  const { queries } = useStarlight();
  const { data: chats } = useSuspenseQuery(queries.chats(projectId));

  return (
    <div className="flex flex-col gap-px pl-4">
      <NavItem
        icon={MessageAdd01Icon}
        render={<Link to="/p/$projectId/chats" params={{ projectId }} activeOptions={{ exact: true }} />}
      >
        New chat
      </NavItem>
      {chats.map((chat) => (
        <ChatItem key={chat.id} chat={chat} />
      ))}
    </div>
  );
};
