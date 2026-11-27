import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useModelChoice } from "#renderer/features/providers/model-choice.ts";
import { ModelPicker } from "#renderer/features/providers/model-picker.tsx";
import { NoProvider } from "#renderer/features/providers/no-provider.tsx";
import { PageHeader } from "#renderer/features/shell/page-header.tsx";
import { useStarlight } from "#renderer/lib/context.ts";
import { chatLink } from "./chat-links.ts";
import { Composer } from "./composer.tsx";

export const NewChat = ({ projectId }: { readonly projectId: string | null }) => {
  const navigate = useNavigate();
  const { mutations } = useStarlight();
  const start = useMutation(mutations.startChat());
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
              start.mutateAsync({ projectId, text, model: choice }).then((chat) => navigate(chatLink(chat)))
            }
          />
        ) : (
          <NoProvider />
        )}
      </div>
    </>
  );
};
