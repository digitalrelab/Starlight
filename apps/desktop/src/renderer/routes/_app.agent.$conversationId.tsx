import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Composer } from "../features/agent/composer.tsx";
import { Transcript } from "../features/agent/transcript.tsx";
import { PageHeader } from "../features/shell/page-header.tsx";
import { useStarlight } from "../lib/context.ts";

export const Route = createFileRoute("/_app/agent/$conversationId")({
  loader: ({ context: { queryClient, queries }, params }) =>
    queryClient.ensureQueryData(queries.conversation(params.conversationId)),
  component: ConversationPage,
});

function ConversationPage() {
  const { conversationId } = Route.useParams();
  const { queries, mutations, subscriptions } = useStarlight();
  useEffect(() => subscriptions.conversation(conversationId), [subscriptions, conversationId]);
  const { data: detail } = useSuspenseQuery(queries.conversation(conversationId));
  const { data: failure = null } = useQuery(queries.conversationFailure(conversationId));
  const send = useMutation(mutations.sendMessage());

  return (
    <>
      <PageHeader>
        <span className="truncate font-medium">{detail.conversation.title}</span>
      </PageHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-6 py-8">
          <Transcript messages={detail.messages} draft={detail.draft} failure={failure} />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 px-6 pb-6">
        <Composer
          placeholder="Reply…"
          autoFocus
          disabled={detail.draft !== null || send.isPending}
          onSubmit={(text) => send.mutate({ conversationId, text })}
        />
        {send.error ? <p className="text-sm text-danger">{send.error.message}</p> : null}
      </div>
    </>
  );
}
