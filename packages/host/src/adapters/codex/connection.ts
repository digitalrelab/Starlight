import { Effect, Option } from "effect";
import { findCommand } from "#adapters/cli.ts";
import { type AppServer, connectAppServer } from "./app-server.ts";

const DISABLED_FEATURES = [
  "apps",
  "browser_use",
  "code_mode_host",
  "collaboration_modes",
  "computer_use",
  "goals",
  "hooks",
  "image_generation",
  "in_app_browser",
  "multi_agent",
  "realtime_conversation",
  "remote_plugin",
  "shell_tool",
  "skill_search",
  "sleep_tool",
  "view_image",
];

interface EffectiveConfig {
  readonly mcp_servers?: Record<string, unknown> | null;
  readonly plugins?: Record<string, unknown> | null;
}

const off = (keys: ReadonlyArray<string>) => Object.fromEntries(keys.map((key) => [key, false]));

export const findExecutable = findCommand("codex", [".local/bin/codex"]);

export interface Connection {
  readonly server: AppServer;
  readonly isolation: Record<string, unknown>;
  readonly plugins: ReadonlyArray<string>;
  readonly threads: Set<string>;
}

const open = async (workingDirectory: string): Promise<Connection> => {
  const executable = await Effect.runPromise(findExecutable);
  if (Option.isNone(executable)) throw new Error("Codex isn't installed.");
  const server = await connectAppServer(executable.value);
  const { config } = await server.request<{ config: EffectiveConfig }>("config/read", {
    cwd: workingDirectory,
  });
  return {
    server,
    isolation: {
      notify: [],
      web_search: "disabled",
      project_doc_max_bytes: 0,
      ...off(DISABLED_FEATURES.map((feature) => `features.${feature}`)),
      ...off(Object.keys(config.mcp_servers ?? {}).map((name) => `mcp_servers.${name}.enabled`)),
    },
    plugins: Object.keys(config.plugins ?? {}),
    threads: new Set(),
  };
};

export const makeConnector = (workingDirectory: string) => {
  let current: Promise<Connection> | undefined;
  return async (): Promise<Connection> => {
    current ??= open(workingDirectory);
    const pending = current;
    const connection = await pending.catch((error: unknown) => {
      if (current === pending) current = undefined;
      throw error;
    });
    if (connection.server.alive) return connection;
    if (current === pending) current = open(workingDirectory);
    return current;
  };
};
