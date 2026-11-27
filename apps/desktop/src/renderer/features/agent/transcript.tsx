import type { ChatMessage, Draft } from "@starlight/client";
import { Markdown, Shimmer } from "@starlight/ui";
import { useEffect, useRef } from "react";

interface Props {
  readonly messages: ReadonlyArray<ChatMessage>;
  readonly draft: Draft | null;
  readonly failure: string | null;
}

const Message = ({ role, text }: Pick<ChatMessage, "role" | "text">) => {
  if (role === "user") {
    return <p className="max-w-[80%] self-end rounded-lg bg-neutral px-3 py-2 whitespace-pre-wrap">{text}</p>;
  }
  return text === "" ? <Shimmer>Thinking…</Shimmer> : <Markdown source={text} />;
};

export const Transcript = ({ messages, draft, failure }: Props) => {
  const end = useRef<HTMLDivElement>(null);
  const items = draft
    ? [...messages, { id: draft.id, role: "assistant" as const, text: draft.text }]
    : messages;

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [items.length, draft?.text]);

  return (
    <div className="flex flex-col gap-6">
      {items.map((message) => (
        <Message key={message.id} role={message.role} text={message.text} />
      ))}
      {failure ? <p className="text-sm text-danger">{failure}</p> : null}
      <div ref={end} />
    </div>
  );
};
