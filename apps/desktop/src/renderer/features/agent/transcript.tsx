import type { ChatMessage, Draft } from "@starlight/client";
import { cn, Markdown, Shimmer } from "@starlight/ui";
import { useRevealedText } from "./use-revealed-text.ts";
import { useStickToBottom } from "./use-stick-to-bottom.ts";

interface Props {
  readonly messages: ReadonlyArray<ChatMessage>;
  readonly draft: Draft | null;
  readonly failure: string | null;
  readonly className?: string;
}

const Reply = ({ text, reveal }: { readonly text: string; readonly reveal: boolean }) => (
  <Markdown source={useRevealedText(text, reveal)} />
);

const Message = ({
  role,
  text,
  pending,
}: Pick<ChatMessage, "role" | "text"> & { readonly pending: boolean }) => {
  if (role === "user") {
    return <p className="max-w-[80%] self-end rounded-lg bg-neutral px-3 py-2 whitespace-pre-wrap">{text}</p>;
  }
  return pending && text === "" ? <Shimmer>Thinking…</Shimmer> : <Reply text={text} reveal={pending} />;
};

export const Transcript = ({ messages, draft, failure, className }: Props) => {
  const { scroller, content } = useStickToBottom(messages.findLast((message) => message.role === "user")?.id);
  const items = draft
    ? [...messages, { id: draft.id, role: "assistant" as const, text: draft.text }]
    : messages;

  return (
    <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
      <div ref={content} className={cn("flex flex-col gap-6", className)}>
        {items.map((message) => (
          <Message
            key={message.id}
            role={message.role}
            text={message.text}
            pending={message.id === draft?.id}
          />
        ))}
        {failure ? <p className="text-sm text-danger">{failure}</p> : null}
      </div>
    </div>
  );
};
