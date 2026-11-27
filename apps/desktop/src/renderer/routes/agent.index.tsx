import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Composer } from "../features/agent/composer.tsx";
import { useModelChoice } from "../features/providers/model-choice.ts";
import { ModelPicker } from "../features/providers/model-picker.tsx";
import { NoProvider } from "../features/providers/no-provider.tsx";
import { PageHeader } from "../features/shell/page-header.tsx";
import { useStarlight } from "../lib/context.ts";

export const Route = createFileRoute("/agent/")({
  component: NewConversation,
});

function NewConversation() {
  const navigate = useNavigate();
  const { mutations } = useStarlight();
  const send = useMutation(mutations.sendMessage());
  const { providers, choice, choose } = useModelChoice();

  return (
    <>
      <PageHeader>
        <span className="font-medium">New conversation</span>
      </PageHeader>
      <div className="mx-auto w-full max-w-2xl px-6 py-16">
        {choice ? (
          <Composer
            placeholder="Ask Starlight…"
            autoFocus
            actions={<ModelPicker providers={providers} choice={choice} onChoose={choose} />}
            onSubmit={(text) =>
              send
                .mutateAsync({ conversationId: null, text, model: choice })
                .then((conversation) =>
                  navigate({ to: "/agent/$conversationId", params: { conversationId: conversation.id } }),
                )
            }
          />
        ) : (
          <NoProvider />
        )}
      </div>
    </>
  );
}
