import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Composer } from "../features/agent/composer.tsx";
import { ConversationList } from "../features/agent/conversation-list.tsx";
import { PageHeader } from "../features/shell/page-header.tsx";
import { useStarlight } from "../lib/context.ts";

export const Route = createFileRoute("/_app/agent/")({
  loader: ({ context: { queryClient, queries } }) => queryClient.ensureQueryData(queries.conversations()),
  component: Agent,
});

function Agent() {
  const navigate = useNavigate();
  const { queries, mutations } = useStarlight();
  const { data: conversations } = useSuspenseQuery(queries.conversations());
  const send = useMutation(mutations.sendMessage());

  return (
    <>
      <PageHeader>
        <span className="font-medium">Agent</span>
      </PageHeader>
      <div className="overflow-y-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-16">
          <Composer
            placeholder="Ask Starlight…"
            autoFocus
            onSubmit={(text) =>
              send
                .mutateAsync({ conversationId: null, text })
                .then((conversation) =>
                  navigate({ to: "/agent/$conversationId", params: { conversationId: conversation.id } }),
                )
            }
          />
          <ConversationList conversations={conversations} />
        </div>
      </div>
    </>
  );
}
