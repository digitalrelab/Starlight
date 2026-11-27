import { join } from "node:path";
import { app, type UtilityProcess, utilityProcess } from "electron";

/** `host.js` is emitted next to this file by electron.vite.config.ts. */
export const startHost = (): UtilityProcess => {
  const host = utilityProcess.fork(join(import.meta.dirname, "host.js"), [], {
    serviceName: "Starlight Host",
    stdio: "inherit",
    env: { ...process.env, STARLIGHT_DATA_DIR: app.getPath("userData") },
  });
  host.on("exit", (code) => {
    console.error(`[host] exited with code ${code}`);
  });
  return host;
};
