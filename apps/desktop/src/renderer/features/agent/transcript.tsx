import type { ChatMessage, Draft } from "@starlight/client";
import { Markdown } from "@starlight/markdown";
import { cn, ScrollArea } from "@starlight/ui";
import { useRevealedText } from "./use-revealed-text.ts";
import { useStickToBottom } from "./use-stick-to-bottom.ts";

interface Props {
  readonly messages: ReadonlyArray<ChatMessage>;
  readonly draft: Draft | null;
  readonly failure: string | null;
  readonly className?: string;
}

const Reply = ({ text, pending }: { readonly text: string; readonly pending: boolean }) => {
  const shown = useRevealedText(text);
  return pending && shown === "" ? (
    <p className="w-fit shimmer-text">Thinking…</p>
  ) : (
    <Markdown value={shown} className="whitespace-pre-line" />
  );
};

const Message = ({
  role,
  text,
  pending,
}: Pick<ChatMessage, "role" | "text"> & { readonly pending: boolean }) =>
  role === "user" ? (
    <p className="max-w-[80%] self-end rounded-lg bg-neutral px-3 py-2 whitespace-pre-wrap">{text}</p>
  ) : (
    <Reply text={text} pending={pending} />
  );

export const Transcript = ({ messages, draft, failure, className }: Props) => {
  const { viewport, content } = useStickToBottom(messages.findLast((message) => message.role === "user")?.id);
  const items = draft
    ? [...messages, { id: draft.id, role: "assistant" as const, text: draft.text }]
    : messages;

  return (
    <ScrollArea
      className="flex-1"
      viewportRef={viewport}
      contentRef={content}
      contentClassName={cn("flex flex-col gap-6", className)}
    >
      {items.map((message) => (
        <Message
          key={message.id}
          role={message.role}
          text={message.text}
          pending={message.id === draft?.id}
        />
      ))}
      {failure ? <p className="text-sm text-danger">{failure}</p> : null}
    </ScrollArea>
  );
};
