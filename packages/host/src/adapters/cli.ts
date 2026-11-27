import { execFile } from "node:child_process";
import { access, constants } from "node:fs/promises";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";
import { Effect, Option } from "effect";

export const COMMAND_TIMEOUT_MS = 10_000;

export const output = (file: string, args: ReadonlyArray<string>) =>
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

const fromLoginShell = (name: string) =>
  output(process.env["SHELL"] ?? "/bin/zsh", ["-ilc", `command -v ${name}`]).pipe(
    Effect.map((stdout) => Option.fromNullishOr(stdout.split("\n").at(-1)).pipe(Option.filter(isAbsolute))),
    Effect.orElseSucceed(() => Option.none<string>()),
  );

export const findCommand = (name: string, homeLocations: ReadonlyArray<string>) =>
  Effect.findFirst(
    [
      ...homeLocations.map((location) => join(homedir(), location)),
      `/opt/homebrew/bin/${name}`,
      `/usr/local/bin/${name}`,
    ],
    isExecutable,
  ).pipe(Effect.flatMap((found) => (Option.isSome(found) ? Effect.succeed(found) : fromLoginShell(name))));
