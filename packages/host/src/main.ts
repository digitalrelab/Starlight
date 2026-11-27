import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { NodeRuntime } from "@effect/platform-node";
import {
  type Actor,
  ClaudeCodeProvider,
  CodexProvider,
  HostChannel,
  LocalSource,
} from "@starlight/contracts";
import { AgentProviderDrivers, CoreLive, IdGenerator, SourceDrivers } from "@starlight/core";
import { Effect, Layer, Option, Queue, Schema } from "effect";
import { makeClaudeCodeDriver } from "./adapters/claude-code/index.ts";
import { makeCodexDriver } from "./adapters/codex/index.ts";
import { FileTokensLive } from "./adapters/file-tokens.ts";
import { Imaging, ImagingLive } from "./adapters/imaging.ts";
import { makeLocalSource } from "./adapters/local-source/index.ts";
import { SqliteLive } from "./adapters/sqlite/index.ts";
import { HostServerLive } from "./rpc/server.ts";
import { type MainPortLike, serve } from "./rpc/transport.ts";

interface Connection {
  readonly actor: Actor;
  readonly port: MainPortLike;
}

interface ParentPort {
  on(
    event: "message",
    listener: (event: { data: unknown; ports: ReadonlyArray<MainPortLike> }) => void,
  ): void;
}

const parentPort = (process as unknown as { parentPort?: ParentPort }).parentPort;
if (!parentPort) throw new Error("host must run inside an Electron utilityProcess");

const requireEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
};

const databasePath = requireEnv("STARLIGHT_DATABASE_PATH");
const agentDir = requireEnv("STARLIGHT_AGENT_PATH");
mkdirSync(agentDir, { recursive: true });
const fileKey = Buffer.from(requireEnv("STARLIGHT_FILE_KEY"), "hex");

const decodeChannel = Schema.decodeUnknownOption(HostChannel);
const imagingPort = Promise.withResolvers<MainPortLike>();
const connections = Effect.runSync(Queue.unbounded<Connection>());

parentPort.on("message", ({ data, ports: [port] }) => {
  const channel = decodeChannel(data);
  if (!port || Option.isNone(channel)) return;
  if (channel.value._tag === "Imaging") imagingPort.resolve(port);
  else Queue.offerUnsafe(connections, { actor: channel.value.actor, port });
});

const SourceDriversLive = Layer.effect(SourceDrivers)(
  Effect.gen(function* () {
    return new Map([[LocalSource, makeLocalSource(yield* Imaging)]]);
  }),
).pipe(Layer.provide(ImagingLive(() => imagingPort.promise)));

const AgentProviderDriversLive = Layer.succeed(AgentProviderDrivers)(
  new Map([
    [ClaudeCodeProvider, makeClaudeCodeDriver(agentDir)],
    [CodexProvider, makeCodexDriver(agentDir)],
  ]),
);

const IdGeneratorLive = Layer.succeed(IdGenerator)({ next: Effect.sync(randomUUID) });

const HostLive = CoreLive.pipe(
  Layer.provide(
    Layer.mergeAll(
      SourceDriversLive,
      AgentProviderDriversLive,
      IdGeneratorLive,
      FileTokensLive(fileKey),
      SqliteLive(databasePath),
    ),
  ),
);

const accept = ({ actor, port }: Connection) =>
  serve(port, HostServerLive(actor)).pipe(Effect.ignoreCause({ log: true }), Effect.forkChild);

const program = Effect.gen(function* () {
  yield* Effect.logInfo("host ready");
  return yield* Queue.take(connections).pipe(Effect.flatMap(accept), Effect.forever);
}).pipe(Effect.provide(HostLive));

NodeRuntime.runMain(program);
