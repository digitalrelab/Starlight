import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { PageHeader } from "#renderer/features/shell/page-header.tsx";
import { useStarlight } from "#renderer/lib/context.ts";
import { chatLink } from "./chat-links.ts";
import { ModelComposer } from "./model-composer.tsx";

export const NewChat = ({ projectId }: { readonly projectId: string | null }) => {
  const navigate = useNavigate();
  const { mutations } = useStarlight();
  const start = useMutation(mutations.startChat());

  return (
    <>
      <PageHeader>
        <span className="font-medium">New chat</span>
      </PageHeader>
      <div className="mx-auto w-full max-w-2xl px-6 py-16">
        <ModelComposer
          placeholder="Ask Starlight…"
          onSubmit={(text, model) =>
            start.mutateAsync({ projectId, text, model }).then((chat) => navigate(chatLink(chat)))
          }
        />
      </div>
    </>
  );
};
