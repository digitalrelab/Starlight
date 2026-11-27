import { join } from "node:path";
import type { ConnectRequest } from "@starlight/contracts";
import { app, type MessagePortMain, type UtilityProcess, utilityProcess } from "electron";

/** A host that dies sooner than this after starting is not restarted, to avoid a crash loop. */
const MIN_UPTIME_MS = 5_000;

const fork = () =>
  // `host.js` is emitted next to this file by electron.vite.config.ts.
  utilityProcess.fork(join(import.meta.dirname, "host.js"), [], {
    serviceName: "Starlight Host",
    stdio: "inherit",
    env: { ...process.env, STARLIGHT_DATA_DIR: app.getPath("userData") },
  });

/** Keeps one host process running. After a restart, `onRestart` must reconnect every client. */
export const superviseHost = (onRestart: () => void) => {
  let stopping = false;
  let current: UtilityProcess;

  const start = () => {
    const startedAt = Date.now();
    current = fork();
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
