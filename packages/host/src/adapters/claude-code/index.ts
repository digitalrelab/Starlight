import { execFile } from "node:child_process";
import { access, constants } from "node:fs/promises";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";
import type { AgentProviderStatus } from "@starlight/contracts";
import type { AgentProviderDriver } from "@starlight/core";
import { Effect, Option, Schema } from "effect";

const COMMAND_TIMEOUT_MS = 10_000;

const installLocations = [
  join(homedir(), ".local/bin/claude"),
  join(homedir(), ".claude/local/claude"),
  "/opt/homebrew/bin/claude",
  "/usr/local/bin/claude",
];

const AuthStatus = Schema.fromJsonString(
  Schema.Struct({
    loggedIn: Schema.Boolean,
    email: Schema.optionalKey(Schema.String),
    subscriptionType: Schema.optionalKey(Schema.String),
  }),
);

const output = (file: string, args: ReadonlyArray<string>) =>
  Effect.callback<string, Error>((resume) => {
    const child = execFile(file, args, { timeout: COMMAND_TIMEOUT_MS }, (error, stdout) => {
      if (error && !stdout) resume(Effect.fail(error));
      else resume(Effect.succeed(stdout.trim()));
    });
    return Effect.sync(() => child.kill());
  });

const isExecutable = (path: string) =>
  Effect.tryPromise(() => access(path, constants.X_OK)).pipe(
    Effect.as(true),
    Effect.orElseSucceed(() => false),
  );

const fromLoginShell = output(process.env["SHELL"] ?? "/bin/zsh", ["-ilc", "command -v claude"]).pipe(
  Effect.map((stdout) => Option.fromNullishOr(stdout.split("\n").at(-1)).pipe(Option.filter(isAbsolute))),
  Effect.orElseSucceed(() => Option.none<string>()),
);

const findExecutable = Effect.findFirst(installLocations, isExecutable).pipe(
  Effect.flatMap((found) => (Option.isSome(found) ? Effect.succeed(found) : fromLoginShell)),
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

export const claudeCodeDriver: AgentProviderDriver = { name: "Claude Code", status };
