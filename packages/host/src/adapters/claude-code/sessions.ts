import { deleteSession } from "@anthropic-ai/claude-agent-sdk";
import { Effect } from "effect";

export const forget = (workingDirectory: string) => (session: string) =>
  Effect.tryPromise(() => deleteSession(session, { dir: workingDirectory })).pipe(
    Effect.catch((error) => Effect.logWarning("Claude Code session could not be deleted", error)),
  );
