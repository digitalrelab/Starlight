import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { ConversationNotFound } from "@starlight/client";
import { createFileRoute, type ErrorComponentProps, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Composer } from "../features/agent/composer.tsx";
import { Transcript } from "../features/agent/transcript.tsx";
import { useModelChoice } from "../features/providers/model-choice.ts";
import { ModelPicker } from "../features/providers/model-picker.tsx";
import { NoProvider } from "../features/providers/no-provider.tsx";
import { PageError } from "../features/shell/page-error.tsx";
import { PageHeader } from "../features/shell/page-header.tsx";
import { useStarlight } from "../lib/context.ts";

export const Route = createFileRoute("/_app/agent/$conversationId")({
  loader: ({ context: { queryClient, queries }, params }) =>
    Promise.all([
      queryClient.ensureQueryData(queries.conversation(params.conversationId)),
      queryClient.ensureQueryData(queries.agentProviders()),
    ]),
  component: ConversationPage,
  errorComponent: ConversationError,
});

function ConversationPage() {
  const { conversationId } = Route.useParams();
  const { queries, mutations, subscriptions } = useStarlight();
  useEffect(() => subscriptions.conversation(conversationId), [subscriptions, conversationId]);
  const { data: detail } = useSuspenseQuery(queries.conversation(conversationId));
  const send = useMutation(mutations.sendMessage());
  const { providers, choice, choose } = useModelChoice(detail.conversation);

  return (
    <>
      <PageHeader>
        <span className="truncate font-medium">{detail.conversation.title}</span>
      </PageHeader>
      <Transcript
        messages={detail.messages}
        draft={detail.draft}
        failure={detail.failure}
        className="mx-auto w-full max-w-2xl px-6 py-8"
      />
      <div className="mx-auto w-full max-w-2xl px-6 pb-6">
        {choice ? (
          <Composer
            placeholder="Reply…"
            autoFocus
            disabled={detail.draft !== null}
            actions={<ModelPicker providers={providers} choice={choice} onChoose={choose} />}
            onSubmit={(text) => send.mutateAsync({ conversationId, text, model: choice })}
          />
        ) : (
          <NoProvider />
        )}
      </div>
    </>
  );
}

function ConversationError({ error }: ErrorComponentProps) {
  return error instanceof ConversationNotFound ? (
    <Navigate to="/agent" replace />
  ) : (
    <PageError error={error} />
  );
}
