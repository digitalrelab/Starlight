import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { type AgentTurnEvent, AgentTurnFailed, type AgentTurnInput } from "@starlight/core";
import { Effect, Exit, Option, Stream } from "effect";
import type { Pool } from "./pool.ts";

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
  (pool: Pool) =>
  ({ prompt, session, model }: AgentTurnInput): Stream.Stream<AgentTurnEvent, AgentTurnFailed> =>
    Stream.unwrap(
      Effect.map(
        Effect.tryPromise({
          try: () => pool.acquire(Option.getOrUndefined(session)),
          catch: AgentTurnFailed.from,
        }),
        (claude) =>
          Stream.fromAsyncIterable(claude.turn(prompt, model), AgentTurnFailed.from).pipe(
            Stream.flatMap(toEvents),
            Stream.onExit((exit) =>
              Effect.sync(() => (Exit.isSuccess(exit) ? pool.park(claude) : claude.close())),
            ),
          ),
      ),
    );
