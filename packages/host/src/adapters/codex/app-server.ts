import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

interface Message {
  readonly id?: number;
  readonly method?: string;
  readonly params?: unknown;
  readonly result?: unknown;
  readonly error?: { readonly message: string };
}

export interface Inbound {
  readonly method: string;
  readonly params: { readonly threadId?: string } & Record<string, unknown>;
}

export type Answerer = (request: Inbound) => Promise<unknown> | undefined;

const subscribe =
  <A>(subscribers: Set<A>) =>
  (subscriber: A) => {
    subscribers.add(subscriber);
    return () => {
      subscribers.delete(subscriber);
    };
  };

const parse = (line: string): Message | undefined => {
  try {
    return JSON.parse(line) as Message;
  } catch {
    return undefined;
  }
};

export const connectAppServer = async (executable: string) => {
  const child = spawn(executable, ["app-server"], { stdio: ["pipe", "pipe", "ignore"] });
  const pending = new Map<number, { resolve: (result: unknown) => void; reject: (error: Error) => void }>();
  const listeners = new Set<(notification: Inbound) => void>();
  const answerers = new Set<Answerer>();
  let next = 0;
  let alive = true;

  const send = (message: object) => child.stdin.write(`${JSON.stringify(message)}\n`);

  const stop = (error: Error) => {
    alive = false;
    for (const waiter of pending.values()) waiter.reject(error);
    pending.clear();
  };

  const answerOf = (request: Inbound) => {
    for (const answerer of answerers) {
      const answer = answerer(request);
      if (answer) return answer;
    }
    return undefined;
  };

  child.on("exit", () => stop(new Error("Codex stopped.")));
  child.on("error", stop);
  child.stdin.on("error", stop);

  createInterface({ input: child.stdout }).on("line", (line) => {
    const message = parse(line);
    if (!message) return;
    if (message.method === undefined) {
      const waiter = message.id === undefined ? undefined : pending.get(message.id);
      if (!waiter || message.id === undefined) return;
      pending.delete(message.id);
      if (message.error) waiter.reject(new Error(message.error.message));
      else waiter.resolve(message.result);
      return;
    }
    const inbound = { method: message.method, params: (message.params ?? {}) as Inbound["params"] };
    if (message.id === undefined) {
      for (const listener of listeners) listener(inbound);
      return;
    }
    const { id } = message;
    const answer = answerOf(inbound);
    if (!answer) {
      send({ id, error: { code: -32601, message: "Starlight does not handle this request." } });
      return;
    }
    answer.then(
      (result) => send({ id, result }),
      (error: unknown) => send({ id, error: { code: -32603, message: String(error) } }),
    );
  });

  const request = <A>(method: string, params: unknown) =>
    new Promise<A>((resolve, reject) => {
      if (!alive) return reject(new Error("Codex stopped."));
      const id = next++;
      pending.set(id, { resolve: (result) => resolve(result as A), reject });
      send({ id, method, params });
    });

  await request("initialize", {
    clientInfo: { name: "starlight", title: "Starlight", version: "1" },
    capabilities: { experimentalApi: true },
  });
  send({ method: "initialized" });

  return {
    request,
    listen: subscribe(listeners),
    answer: subscribe(answerers),
    get alive() {
      return alive;
    },
  };
};

export type AppServer = Awaited<ReturnType<typeof connectAppServer>>;
