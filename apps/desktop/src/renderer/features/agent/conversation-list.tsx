import type { Conversation } from "@starlight/client";
import { Link } from "@tanstack/react-router";
import { formatAge } from "#renderer/lib/format.ts";

interface Props {
  readonly conversations: ReadonlyArray<Conversation>;
}

export const ConversationList = ({ conversations }: Props) => (
  <ul className="flex flex-col">
    {conversations.map((conversation) => (
      <li key={conversation.id}>
        <Link
          to="/agent/$conversationId"
          params={{ conversationId: conversation.id }}
          className="flex h-10 items-center justify-between gap-4 rounded-md px-3 text-subtle focus-ring hover:bg-neutral-subtle-hovered hover:text-default"
        >
          <span className="truncate">{conversation.title}</span>
          <span className="shrink-0 text-sm text-subtlest tabular-nums">
            {formatAge(conversation.updatedAt)}
          </span>
        </Link>
      </li>
    ))}
  </ul>
);
