import type { AgentProviderStatus } from "@starlight/contracts";
import type { AgentProviderDriver } from "@starlight/core";
import { Effect, Option, Schema } from "effect";
import { findExecutable, output } from "./executable.ts";
import { makeModels } from "./models.ts";
import { respond } from "./respond.ts";
import { forget } from "./sessions.ts";

const AuthStatus = Schema.fromJsonString(
  Schema.Struct({
    loggedIn: Schema.Boolean,
    email: Schema.optionalKey(Schema.String),
    subscriptionType: Schema.optionalKey(Schema.String),
  }),
);

const notReady = (message: string): AgentProviderStatus => ({ _tag: "NotReady", message });

const planLabel = (plan: string) => plan.charAt(0).toUpperCase() + plan.slice(1);

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
    ...(auth.subscriptionType ? { plan: planLabel(auth.subscriptionType) } : {}),
  } satisfies AgentProviderStatus;
}).pipe(Effect.catch((error) => Effect.succeed(notReady(error.message))));

export const makeClaudeCodeDriver = (workingDirectory: string): AgentProviderDriver => ({
  name: "Claude Code",
  status,
  models: makeModels(workingDirectory),
  forget: forget(workingDirectory),
  respond: respond(workingDirectory),
});
