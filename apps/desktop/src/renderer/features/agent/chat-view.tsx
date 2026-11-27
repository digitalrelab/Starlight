import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useModelChoice } from "#renderer/features/providers/model-choice.ts";
import { ModelPicker } from "#renderer/features/providers/model-picker.tsx";
import { NoProvider } from "#renderer/features/providers/no-provider.tsx";
import { PageHeader } from "#renderer/features/shell/page-header.tsx";
import { useStarlight } from "#renderer/lib/context.ts";
import { Composer } from "./composer.tsx";
import { Transcript } from "./transcript.tsx";

export const ChatView = ({ chatId }: { readonly chatId: string }) => {
  const { queries, mutations, subscriptions } = useStarlight();
  useEffect(() => subscriptions.chat(chatId), [subscriptions, chatId]);
  const { data: detail } = useSuspenseQuery(queries.chat(chatId));
  const send = useMutation(mutations.sendMessage());
  const { providers, choice, choose } = useModelChoice(detail.chat);

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
        {choice ? (
          <Composer
            placeholder="Reply…"
            autoFocus
            disabled={detail.draft !== null}
            actions={<ModelPicker providers={providers} choice={choice} onChoose={choose} />}
            onSubmit={(text) => send.mutateAsync({ chatId, text, model: choice })}
          />
        ) : (
          <NoProvider />
        )}
      </div>
    </>
  );
};
