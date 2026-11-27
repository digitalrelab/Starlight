import { deleteSession } from "@anthropic-ai/claude-agent-sdk";
import type { AgentProviderStatus } from "@starlight/contracts";
import type { AgentProviderDriver } from "@starlight/core";
import { Effect, Option, Schema } from "effect";
import { capitalized, notReady } from "#adapters/agent.ts";
import { findCommand, output } from "#adapters/cli.ts";
import { makeModels } from "./models.ts";
import { makePool } from "./pool.ts";
import { respond } from "./respond.ts";
import { openSession } from "./session.ts";

const findExecutable = findCommand("claude", [".local/bin/claude", ".claude/local/claude"]);

const AuthStatus = Schema.fromJsonString(
  Schema.Struct({
    loggedIn: Schema.Boolean,
    email: Schema.optionalKey(Schema.String),
    subscriptionType: Schema.optionalKey(Schema.String),
  }),
);

const status: Effect.Effect<AgentProviderStatus> = Effect.gen(function* () {
  const executable = yield* findExecutable;
  if (Option.isNone(executable)) {
    return notReady("Install Claude Code, then run “claude auth login” in a terminal.");
  }
  const [version, auth] = yield* Effect.all(
    [
      output(executable.value, ["--version"]),
      output(executable.value, ["auth", "status", "--json"]).pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(AuthStatus)),
      ),
    ],
    { concurrency: "unbounded" },
  );
  if (!auth.loggedIn) return notReady("Signed out. Run “claude auth login” in a terminal.");
  return {
    _tag: "Ready",
    version: version.split(" ")[0] ?? version,
    ...(auth.email ? { account: auth.email } : {}),
    ...(auth.subscriptionType ? { plan: capitalized(auth.subscriptionType) } : {}),
  } satisfies AgentProviderStatus;
}).pipe(Effect.catch((error) => Effect.succeed(notReady(error.message))));

export const makeClaudeCodeDriver = (workingDirectory: string): AgentProviderDriver => {
  const pool = makePool(async (resume) => {
    const executable = await Effect.runPromise(findExecutable);
    if (Option.isNone(executable)) throw new Error("Claude Code isn't installed.");
    return openSession(executable.value, workingDirectory, resume);
  });
  return {
    name: "Claude Code",
    status,
    models: makeModels(pool),
    prepare: Effect.sync(() => void pool.prepare().catch(() => {})),
    forget: (session) =>
      Effect.sync(() => pool.forget(session)).pipe(
        Effect.andThen(Effect.tryPromise(() => deleteSession(session, { dir: workingDirectory }))),
        Effect.catch((error) => Effect.logWarning("Claude Code session could not be deleted", error)),
      ),
    respond: respond(pool),
  };
};
