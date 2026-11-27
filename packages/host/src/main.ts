import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { NodeRuntime } from "@effect/platform-node";
import { ClaudeCodeProvider, ConnectRequest, LocalSource } from "@starlight/contracts";
import { AgentProviderDrivers, CoreLive, SourceDrivers } from "@starlight/core";
import { Effect, Layer, Queue, Schema } from "effect";
import { makeClaudeCodeDriver } from "./adapters/claude-code/index.ts";
import { makeLocalSource } from "./adapters/local-source/index.ts";
import { SqliteLive } from "./adapters/sqlite/index.ts";
import { ThumbnailTokensLive } from "./adapters/thumbnail-tokens.ts";
import { HostServerLive } from "./rpc/server.ts";
import { type MainPortLike, serve } from "./rpc/transport.ts";

interface Connection {
  readonly data: unknown;
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

const dataDir = requireEnv("STARLIGHT_DATA_DIR");
const agentDir = join(dataDir, "agent");
mkdirSync(agentDir, { recursive: true });
const thumbnailKey = Buffer.from(requireEnv("STARLIGHT_THUMBNAIL_KEY"), "hex");

const decodeConnect = Schema.decodeUnknownEffect(ConnectRequest);

const SourceDriversLive = Layer.sync(SourceDrivers)(() => new Map([[LocalSource, makeLocalSource()]]));

const AgentProviderDriversLive = Layer.succeed(AgentProviderDrivers)(
  new Map([[ClaudeCodeProvider, makeClaudeCodeDriver(agentDir)]]),
);

const HostLive = CoreLive.pipe(
  Layer.provide(
    Layer.mergeAll(
      SourceDriversLive,
      AgentProviderDriversLive,
      ThumbnailTokensLive(thumbnailKey),
      SqliteLive(dataDir),
    ),
  ),
);

const accept = ({ data, port }: Connection) =>
  serve(port, Layer.unwrap(decodeConnect(data).pipe(Effect.map(({ actor }) => HostServerLive(actor))))).pipe(
    Effect.ignoreCause({ log: true }),
    Effect.forkChild,
  );

const program = Effect.gen(function* () {
  const connections = yield* Queue.unbounded<Connection>();
  parentPort.on("message", ({ data, ports: [port] }) => {
    if (port) Queue.offerUnsafe(connections, { data, port });
  });
  yield* Effect.logInfo("host ready");
  return yield* Queue.take(connections).pipe(Effect.flatMap(accept), Effect.forever);
}).pipe(Effect.provide(HostLive));

NodeRuntime.runMain(program);
