import { ArrowLeft01Icon, MessageAdd01Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { Chat } from "@starlight/client";
import { IconButton, NavItem, NavSection } from "@starlight/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell } from "#renderer/features/shell/app-shell.tsx";
import { useStarlight } from "#renderer/lib/context.ts";
import { formatRecency } from "#renderer/lib/format.ts";
import { ChatItem } from "./chat-item.tsx";

const byRecency = (chats: ReadonlyArray<Chat>) => Map.groupBy(chats, (chat) => formatRecency(chat.updatedAt));

const AgentSidebar = () => {
  const { queries } = useStarlight();
  const { data: chats } = useSuspenseQuery(queries.chats(null));

  return (
    <>
      <div className="flex flex-col gap-1">
        <NavItem icon={ArrowLeft01Icon} render={<Link to="/" />}>
          Back to app
        </NavItem>
        <NavItem icon={MessageAdd01Icon} render={<Link to="/agent" activeOptions={{ exact: true }} />}>
          New chat
        </NavItem>
      </div>
      {[...byRecency(chats)].map(([recency, group]) => (
        <NavSection key={recency} title={recency}>
          {group.map((chat) => (
            <ChatItem key={chat.id} chat={chat} />
          ))}
        </NavSection>
      ))}
    </>
  );
};

const AgentSidebarFooter = () => (
  <IconButton icon={ArrowLeft01Icon} label="Back to app" render={<Link to="/" />} />
);

export const AgentShell = ({ children }: { readonly children: ReactNode }) => (
  <AppShell sidebar={<AgentSidebar />} footer={<AgentSidebarFooter />}>
    {children}
  </AppShell>
);
