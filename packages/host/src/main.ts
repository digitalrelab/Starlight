import { NodePath, NodeRuntime } from "@effect/platform-node";
import { ConnectRequest } from "@starlight/contracts";
import { CoreLive } from "@starlight/core";
import { Effect, Layer, Queue, Schema } from "effect";
import { FileTokensLive } from "./adapters/file-tokens.ts";
import { ImageProbeLive } from "./adapters/image-probe/index.ts";
import { NodeFileSystemLive } from "./adapters/node-file-system.ts";
import { ParcelFileWatcherLive } from "./adapters/parcel-file-watcher.ts";
import { SqliteLive } from "./adapters/sqlite/index.ts";
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
const fileKey = Buffer.from(requireEnv("STARLIGHT_FILE_KEY"), "hex");

const decodeConnect = Schema.decodeUnknownEffect(ConnectRequest);

const HostLive = CoreLive.pipe(
  Layer.provide(
    Layer.mergeAll(
      NodeFileSystemLive,
      ParcelFileWatcherLive,
      ImageProbeLive,
      FileTokensLive(fileKey),
      SqliteLive(dataDir),
      NodePath.layer,
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
