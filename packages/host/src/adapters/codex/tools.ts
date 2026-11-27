import type { AgentToolkit, AgentToolResult } from "@starlight/core";
import { Effect, Option } from "effect";
import type { Answerer } from "./app-server.ts";

const toResponse = ({ content, failed }: AgentToolResult) => ({
  success: !failed,
  contentItems: content.map((item) =>
    item._tag === "Text"
      ? { type: "inputText", text: item.text }
      : { type: "inputImage", imageUrl: `data:${item.mediaType};base64,${item.data}` },
  ),
});

const UNAVAILABLE = toResponse({
  content: [{ _tag: "Text", text: "This chat can't read files." }],
  failed: true,
});

export const threadTools = (toolkit: Option.Option<AgentToolkit>) =>
  Option.match(toolkit, {
    onNone: () => ({}),
    onSome: ({ instructions, tools }) => ({
      developerInstructions: instructions,
      dynamicTools: tools.map(({ name, description, parameters }) => ({
        type: "function",
        name,
        description,
        inputSchema: parameters,
      })),
    }),
  });

export const answerToolCalls =
  (threadId: string, toolkit: Option.Option<AgentToolkit>): Answerer =>
  ({ method, params }) => {
    if (method !== "item/tool/call" || params.threadId !== threadId) return undefined;
    return Option.match(toolkit, {
      onNone: () => Promise.resolve(UNAVAILABLE),
      onSome: ({ call }) =>
        Effect.runPromise(call(String(params["tool"]), params["arguments"])).then(toResponse),
    });
  };
