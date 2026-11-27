import type { ChatMessage, Draft } from "@starlight/client";
import { Markdown } from "@starlight/markdown";
import { cn, ScrollArea } from "@starlight/ui";
import type { RefObject } from "react";
import { useRevealedText } from "./use-revealed-text.ts";

interface Props {
  readonly messages: ReadonlyArray<ChatMessage>;
  readonly draft: Draft | null;
  readonly failure: string | null;
  readonly viewportRef: RefObject<HTMLDivElement | null>;
  readonly contentRef: RefObject<HTMLDivElement | null>;
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
    <Markdown
      value={text}
      className="max-w-[80%] self-end rounded-lg bg-neutral px-3 py-2 whitespace-pre-line"
    />
  ) : (
    <Reply text={text} pending={pending} />
  );

export const Transcript = ({ messages, draft, failure, viewportRef, contentRef, className }: Props) => {
  const items = draft
    ? [...messages, { id: draft.id, role: "assistant" as const, text: draft.text }]
    : messages;

  return (
    <ScrollArea
      className="flex-1"
      ref={viewportRef}
      contentRef={contentRef}
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
