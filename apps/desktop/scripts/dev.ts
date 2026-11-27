import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const STOP_TIMEOUT_MS = 10_000;
const POLL_MS = 100;
const FORWARDED_SIGNALS = ["SIGINT", "SIGTERM", "SIGHUP"] as const;

const root = join(import.meta.dirname, "..");
const pidFile = join(root, ".data", "dev.pid");

const signalGroup = (group: number, signal: NodeJS.Signals | 0) => {
  try {
    process.kill(-group, signal);
    return true;
  } catch {
    return false;
  }
};

const isOwned = (group: number) =>
  spawnSync("ps", ["-Ao", "pgid=,command="], { encoding: "utf8" })
    .stdout.split("\n")
    .some((line) => {
      const [, pgid, command = ""] = /^\s*(\d+)\s+(.*)$/.exec(line) ?? [];
      return Number(pgid) === group && command.includes(root);
    });

const recordedGroup = () => {
  try {
    return Number(readFileSync(pidFile, "utf8"));
  } catch {
    return undefined;
  }
};

const terminate = async (group: number) => {
  if (!signalGroup(group, "SIGTERM")) return;
  const deadline = Date.now() + STOP_TIMEOUT_MS;
  while (signalGroup(group, 0) && Date.now() < deadline) await sleep(POLL_MS);
  signalGroup(group, "SIGKILL");
};

const previous = recordedGroup();
rmSync(pidFile, { force: true });
if (previous !== undefined && isOwned(previous)) await terminate(previous);

if (!process.argv.includes("--stop")) {
  const child = spawn("electron-vite", ["dev"], { cwd: root, detached: true, stdio: "inherit" });
  const group = child.pid;
  if (group === undefined) throw new Error("electron-vite failed to start");
  mkdirSync(dirname(pidFile), { recursive: true });
  writeFileSync(pidFile, String(group));

  let stopping = false;
  for (const signal of FORWARDED_SIGNALS) {
    process.on(signal, () => {
      stopping = true;
      signalGroup(group, signal);
    });
  }
  child.on("exit", async (code) => {
    await terminate(group);
    const current = recordedGroup() === group;
    if (current) rmSync(pidFile, { force: true });
    process.exit(stopping || !current ? 0 : (code ?? 1));
  });
}
