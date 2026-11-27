import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Composer } from "#renderer/features/agent/composer.tsx";
import { useModelChoice } from "#renderer/features/providers/model-choice.ts";
import { ModelPicker } from "#renderer/features/providers/model-picker.tsx";
import { NoProvider } from "#renderer/features/providers/no-provider.tsx";
import { PageHeader } from "#renderer/features/shell/page-header.tsx";
import { useStarlight } from "#renderer/lib/context.ts";

export const Route = createFileRoute("/agent/")({
  component: NewChat,
});

function NewChat() {
  const navigate = useNavigate();
  const { mutations } = useStarlight();
  const send = useMutation(mutations.sendMessage());
  const { providers, choice, choose } = useModelChoice();

  return (
    <>
      <PageHeader>
        <span className="font-medium">New chat</span>
      </PageHeader>
      <div className="mx-auto w-full max-w-2xl px-6 py-16">
        {choice ? (
          <Composer
            placeholder="Ask Starlight…"
            autoFocus
            actions={<ModelPicker providers={providers} choice={choice} onChoose={choose} />}
            onSubmit={(text) =>
              send
                .mutateAsync({ chatId: null, text, model: choice })
                .then((chat) => navigate({ to: "/agent/$chatId", params: { chatId: chat.id } }))
            }
          />
        ) : (
          <NoProvider />
        )}
      </div>
    </>
  );
}
