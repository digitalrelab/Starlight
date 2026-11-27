import { join } from "node:path";
import type { ConnectRequest } from "@starlight/contracts";
import { type MessagePortMain, type UtilityProcess, utilityProcess } from "electron";
import { appData } from "./app-data.ts";

const MIN_UPTIME_MS = 5_000;

const fork = (env: Readonly<Record<string, string>>) => {
  const { database, agent } = appData();
  return utilityProcess.fork(join(import.meta.dirname, "host.js"), [], {
    serviceName: "Starlight Host",
    stdio: "inherit",
    env: { ...process.env, ...env, STARLIGHT_DATABASE_PATH: database, STARLIGHT_AGENT_PATH: agent },
  });
};

export const superviseHost = (env: Readonly<Record<string, string>>, onRestart: () => void) => {
  let stopping = false;
  let current: UtilityProcess;

  const start = () => {
    const startedAt = Date.now();
    current = fork(env);
    current.once("exit", (code) => {
      if (stopping) return;
      console.error(`[host] exited with code ${code}`);
      if (Date.now() - startedAt < MIN_UPTIME_MS) return;
      start();
      onRestart();
    });
  };
  start();

  return {
    connect: (request: ConnectRequest, port: MessagePortMain) => current.postMessage(request, [port]),
    stop: () => {
      stopping = true;
      current.kill();
    },
  };
};
