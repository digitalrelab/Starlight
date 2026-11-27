import type { AgentProviderStatus, AgentUsage } from "@starlight/contracts";
import { Effect } from "effect";
import { COMMAND_TIMEOUT_MS } from "./cli.ts";

export const AGENT_INSTRUCTIONS =
  "You are the assistant inside Starlight, a desktop file manager. Answer clearly and concisely. You can only reach the user's files through the tools Starlight gives you.";

export const NO_FILE_ACCESS = "This chat can't read files.";

const EFFORT_LABELS: Readonly<Record<string, string>> = { xhigh: "Extra High" };

export const capitalized = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const effortLabel = (effort: string) => EFFORT_LABELS[effort] ?? capitalized(effort);

export const asError = (cause: unknown) => (cause instanceof Error ? cause : new Error(String(cause)));

export const notReady = (message: string): AgentProviderStatus => ({ _tag: "NotReady", message });

export const unavailable = (message: string): AgentUsage => ({ _tag: "Unavailable", message });

export const readUsage = <A>(
  name: string,
  read: () => Promise<A>,
  toUsage: (response: A) => AgentUsage,
): Effect.Effect<AgentUsage> =>
  Effect.tryPromise({ try: read, catch: asError }).pipe(
    Effect.map(toUsage),
    Effect.timeoutOrElse({
      duration: COMMAND_TIMEOUT_MS,
      orElse: () => Effect.succeed(unavailable(`${name} didn't respond.`)),
    }),
    Effect.catch((error) => Effect.succeed(unavailable(error.message))),
  );
