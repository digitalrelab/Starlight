import type { ChatMessage, Draft } from "@starlight/client";
import { Markdown } from "@starlight/markdown";
import { ScrollArea } from "@starlight/ui";
import { useVirtualizer } from "@tanstack/react-virtual";
import { type Ref, useEffect, useImperativeHandle, useRef } from "react";
import { renderReference } from "#renderer/features/references/reference-link.tsx";
import { useRevealedText } from "./use-revealed-text.ts";

const ESTIMATED_MESSAGE_HEIGHT = 120;
const MESSAGE_GAP = 24;
const EDGE_SPACE = 32;
const AT_END_WITHIN_PX = 48;

export interface TranscriptHandle {
  readonly scrollToEnd: () => void;
}

interface Props {
  readonly messages: ReadonlyArray<ChatMessage>;
  readonly draft: Draft | null;
  readonly failure: string | null;
  readonly className: string;
  readonly ref: Ref<TranscriptHandle>;
}

const Reply = ({ text, pending }: { readonly text: string; readonly pending: boolean }) => {
  const shown = useRevealedText(text);
  return pending && shown === "" ? (
    <p className="w-fit chat-text shimmer-text">Thinking…</p>
  ) : (
    <Markdown value={shown} renderLink={renderReference} className="chat-text whitespace-pre-line" />
  );
};

export const Message = ({
  role,
  text,
  pending = false,
}: Pick<ChatMessage, "role" | "text"> & { readonly pending?: boolean }) =>
  role === "user" ? (
    <Markdown
      value={text}
      renderLink={renderReference}
      className="max-w-[80%] self-end rounded-lg bg-neutral px-3 py-2 chat-text whitespace-pre-line"
    />
  ) : (
    <Reply text={text} pending={pending} />
  );

interface Row {
  readonly id: string;
  readonly role: ChatMessage["role"] | "failure";
  readonly text: string;
}

const FAILURE_ROW = "failure";

const RowContent = ({ role, text, pending }: Omit<Row, "id"> & { readonly pending: boolean }) =>
  role === "failure" ? (
    <p className="text-sm text-danger">{text}</p>
  ) : (
    <Message role={role} text={text} pending={pending} />
  );

export const Transcript = ({ messages, draft, failure, className, ref }: Props) => {
  const viewport = useRef<HTMLDivElement>(null);
  const rows: ReadonlyArray<Row> = [
    ...messages,
    ...(draft ? [{ id: draft.id, role: "assistant" as const, text: draft.text }] : []),
    ...(failure ? [{ id: FAILURE_ROW, role: "failure" as const, text: failure }] : []),
  ];
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => viewport.current,
    getItemKey: (index) => rows[index]?.id ?? index,
    estimateSize: () => ESTIMATED_MESSAGE_HEIGHT,
    gap: MESSAGE_GAP,
    paddingStart: EDGE_SPACE,
    paddingEnd: EDGE_SPACE,
    overscan: 4,
    anchorTo: "end",
    followOnAppend: true,
    scrollEndThreshold: AT_END_WITHIN_PX,
  });
  useImperativeHandle(ref, () => ({ scrollToEnd: () => virtualizer.scrollToEnd() }), [virtualizer]);
  useEffect(() => virtualizer.scrollToEnd(), [virtualizer]);

  return (
    <ScrollArea className="flex-1" ref={viewport} contentClassName={className}>
      <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((row) => {
          const content = rows[row.index];
          if (!content) return null;
          return (
            <div
              key={row.key}
              ref={virtualizer.measureElement}
              data-index={row.index}
              className="absolute inset-x-0 top-0 flex flex-col"
              style={{ transform: `translateY(${row.start}px)` }}
            >
              <RowContent role={content.role} text={content.text} pending={content.id === draft?.id} />
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
