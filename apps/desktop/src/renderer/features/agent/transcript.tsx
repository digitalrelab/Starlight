import type { ChatMessage, Draft } from "@starlight/client";
import { Markdown } from "@starlight/markdown";
import { ScrollArea } from "@starlight/ui";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";
import { useRevealedText } from "./use-revealed-text.ts";

const ESTIMATED_MESSAGE_HEIGHT = 120;
const MESSAGE_GAP = 24;
const EDGE_SPACE = 32;
const AT_END_WITHIN_PX = 48;

interface Props {
  readonly messages: ReadonlyArray<ChatMessage>;
  readonly draft: Draft | null;
  readonly failure: string | null;
  readonly className: string;
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

export const Transcript = ({ messages, draft, failure, className }: Props) => {
  const viewport = useRef<HTMLDivElement>(null);
  const lastUserMessage = messages.findLast((message) => message.role === "user")?.id;
  const items = draft
    ? [...messages, { id: draft.id, role: "assistant" as const, text: draft.text }]
    : messages;
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => viewport.current,
    getItemKey: (index) => items[index]?.id ?? index,
    estimateSize: () => ESTIMATED_MESSAGE_HEIGHT,
    gap: MESSAGE_GAP,
    paddingStart: EDGE_SPACE,
    paddingEnd: failure ? MESSAGE_GAP : EDGE_SPACE,
    overscan: 4,
    anchorTo: "end",
    followOnAppend: true,
    scrollEndThreshold: AT_END_WITHIN_PX,
  });
  useEffect(() => virtualizer.scrollToEnd(), [virtualizer, lastUserMessage]);

  return (
    <ScrollArea className="flex-1" ref={viewport} contentClassName={className}>
      <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((row) => {
          const message = items[row.index];
          if (!message) return null;
          return (
            <div
              key={row.key}
              ref={virtualizer.measureElement}
              data-index={row.index}
              className="absolute inset-x-0 top-0 flex flex-col"
              style={{ transform: `translateY(${row.start}px)` }}
            >
              <Message role={message.role} text={message.text} pending={message.id === draft?.id} />
            </div>
          );
        })}
      </div>
      {failure ? (
        <p className="text-sm text-danger" style={{ paddingBottom: EDGE_SPACE }}>
          {failure}
        </p>
      ) : null}
    </ScrollArea>
  );
};
