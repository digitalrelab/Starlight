import { MessageAdd01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { NavItem, NavSection } from "@starlight/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChatItem } from "#renderer/features/agent/chat-item.tsx";
import { useStarlight } from "#renderer/lib/context.ts";

export const ProjectChats = ({ projectId }: { readonly projectId: string }) => {
  const { queries } = useStarlight();
  const { data: chats } = useSuspenseQuery(queries.chats(projectId));

  return (
    <>
      <NavItem
        icon={MessageAdd01Icon}
        render={<Link to="/p/$projectId/chats" params={{ projectId }} activeOptions={{ exact: true }} />}
      >
        New chat
      </NavItem>
      {chats.length > 0 ? (
        <NavSection title="Chats">
          {chats.map((chat) => (
            <ChatItem key={chat.id} chat={chat} />
          ))}
        </NavSection>
      ) : null}
    </>
  );
};
