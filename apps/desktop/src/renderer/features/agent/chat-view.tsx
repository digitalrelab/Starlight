import { ChatNotFound } from "@starlight/client";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PageError } from "#renderer/features/shell/page-error.tsx";
import { PageHeader } from "#renderer/features/shell/page-header.tsx";
import { useStarlight } from "#renderer/lib/context.ts";
import { chatsLink } from "./chat-links.ts";
import { ModelComposer } from "./model-composer.tsx";
import { Transcript } from "./transcript.tsx";

export const ChatView = ({ chatId }: { readonly chatId: string }) => {
  const { queries, mutations, subscriptions } = useStarlight();
  useEffect(() => subscriptions.chat(chatId), [subscriptions, chatId]);
  const { data: detail } = useSuspenseQuery(queries.chat(chatId));
  const send = useMutation(mutations.sendMessage());

  return (
    <>
      <PageHeader>
        <span className="truncate font-medium">{detail.chat.title}</span>
      </PageHeader>
      <Transcript
        messages={detail.messages}
        draft={detail.draft}
        failure={detail.failure}
        className="mx-auto w-full max-w-2xl px-6 py-8"
      />
      <div className="mx-auto w-full max-w-2xl px-6 pb-6">
        <ModelComposer
          chat={detail.chat}
          placeholder="Reply…"
          disabled={detail.draft !== null}
          onSubmit={(text, model) => send.mutateAsync({ chatId, text, model })}
        />
      </div>
    </>
  );
};

export const ChatError = ({
  error,
  projectId,
}: {
  readonly error: unknown;
  readonly projectId: string | null;
}) =>
  error instanceof ChatNotFound ? (
    <Navigate {...chatsLink(projectId)} replace />
  ) : (
    <PageError error={error} />
  );
