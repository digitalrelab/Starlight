import type { ChatMessage } from "@starlight/client";
import { Markdown } from "@starlight/ui";
import { useEffect, useRef } from "react";

interface Props {
  readonly messages: ReadonlyArray<ChatMessage>;
  readonly draft: string | null;
  readonly failure: string | null;
}

const Message = ({ role, text }: Pick<ChatMessage, "role" | "text">) =>
  role === "user" ? (
    <p className="max-w-[80%] self-end rounded-lg bg-neutral px-3 py-2 whitespace-pre-wrap">{text}</p>
  ) : (
    <Markdown source={text} />
  );

export const Transcript = ({ messages, draft, failure }: Props) => {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length, draft]);

  return (
    <div className="flex flex-col gap-6">
      {messages.map((message) => (
        <Message key={message.id} role={message.role} text={message.text} />
      ))}
      {draft === null ? null : draft === "" ? (
        <p className="animate-pulse text-subtle">Thinking…</p>
      ) : (
        <Message role="assistant" text={draft} />
      )}
      {failure ? <p className="text-sm text-danger">{failure}</p> : null}
      <div ref={end} />
    </div>
  );
};
