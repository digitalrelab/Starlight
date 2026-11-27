import { ArrowLeft01Icon, PencilEdit02Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { Conversation } from "@starlight/client";
import { IconButton, NavItem, NavSection } from "@starlight/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useStarlight } from "../../lib/context.ts";
import { formatRecency } from "../../lib/format.ts";
import { ConversationItem } from "./conversation-item.tsx";

const byRecency = (conversations: ReadonlyArray<Conversation>) =>
  Map.groupBy(conversations, (conversation) => formatRecency(conversation.updatedAt));

export const AgentSidebar = () => {
  const { queries } = useStarlight();
  const { data: conversations } = useSuspenseQuery(queries.conversations());

  return (
    <>
      <div className="flex flex-col gap-1">
        <NavItem icon={ArrowLeft01Icon} render={<Link to="/" />}>
          Back to app
        </NavItem>
        <NavItem icon={PencilEdit02Icon} render={<Link to="/agent" activeOptions={{ exact: true }} />}>
          New conversation
        </NavItem>
      </div>
      {[...byRecency(conversations)].map(([recency, group]) => (
        <NavSection key={recency} title={recency}>
          {group.map((conversation) => (
            <ConversationItem key={conversation.id} conversation={conversation} />
          ))}
        </NavSection>
      ))}
    </>
  );
};

export const AgentSidebarFooter = () => (
  <IconButton icon={ArrowLeft01Icon} label="Back to app" render={<Link to="/" />} />
);
