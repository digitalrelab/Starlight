import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { type AgentTurnEvent, AgentTurnFailed, type AgentTurnInput } from "@starlight/core";
import { Effect, Option, Stream } from "effect";
import { findExecutable } from "./executable.ts";
import { isEffort } from "./models.ts";

const SYSTEM_PROMPT =
  "You are the assistant inside Starlight, a desktop file manager. Answer clearly and concisely. You cannot see or change the user's files yet.";

const toEvents = (message: SDKMessage): Stream.Stream<AgentTurnEvent, AgentTurnFailed> => {
  if (
    message.type === "stream_event" &&
    message.event.type === "content_block_delta" &&
    message.event.delta.type === "text_delta"
  ) {
    return Stream.succeed({ _tag: "TextDelta", text: message.event.delta.text });
  }
  if (message.type !== "result") return Stream.empty;
  if (message.subtype === "success" && !message.is_error) {
    return Stream.succeed({ _tag: "Completed", session: Option.some(message.session_id) });
  }
  const reason = message.subtype === "success" ? message.result : message.errors.join("\n");
  return Stream.fail(new AgentTurnFailed({ message: reason || "Claude Code could not reply." }));
};

export const respond =
  (workingDirectory: string) =>
  ({ prompt, session, model }: AgentTurnInput): Stream.Stream<AgentTurnEvent, AgentTurnFailed> =>
    Stream.unwrap(
      Effect.gen(function* () {
        const executable = yield* findExecutable;
        if (Option.isNone(executable)) {
          return yield* new AgentTurnFailed({ message: "Claude Code isn't installed." });
        }
        const conversation = query({
          prompt,
          options: {
            pathToClaudeCodeExecutable: executable.value,
            cwd: workingDirectory,
            model: model.model,
            ...(model.effort !== null && isEffort(model.effort) ? { effort: model.effort } : {}),
            systemPrompt: SYSTEM_PROMPT,
            tools: [],
            settingSources: [],
            includePartialMessages: true,
            ...(Option.isSome(session) ? { resume: session.value } : {}),
          },
        });
        return Stream.fromAsyncIterable(
          conversation,
          (cause) => new AgentTurnFailed({ message: cause instanceof Error ? cause.message : String(cause) }),
        ).pipe(Stream.flatMap(toEvents), Stream.ensuring(Effect.sync(() => conversation.close())));
      }),
    );
