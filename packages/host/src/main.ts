/** Host process entry (Electron utilityProcess). One RPC server per connected port. */
import { NodePath, NodeRuntime } from "@effect/platform-node";
import { ConnectRequest } from "@starlight/contracts";
import { CoreLive, type Entries, type Workspaces } from "@starlight/core";
import { Effect, Layer, Schema } from "effect";
import { NodeFileSystemLive } from "./adapters/node-file-system.ts";
import { SqliteLive } from "./adapters/sqlite/index.ts";
import { WorkspaceServerLive } from "./rpc/server.ts";
import { type MainPortLike, serve } from "./rpc/transport.ts";

interface ParentPort {
  on(
    event: "message",
    listener: (event: { data: unknown; ports: ReadonlyArray<MainPortLike> }) => void,
  ): void;
}

const parentPort = (process as unknown as { parentPort?: ParentPort }).parentPort;
if (!parentPort) throw new Error("host must run inside an Electron utilityProcess");

const dataDir = process.env["STARLIGHT_DATA_DIR"];
if (!dataDir) throw new Error("STARLIGHT_DATA_DIR is not set");

const decodeConnect = Schema.decodeUnknownSync(ConnectRequest);

const HostLive = CoreLive.pipe(
  Layer.provide(Layer.mergeAll(NodeFileSystemLive, SqliteLive(dataDir), NodePath.layer)),
);

const program = Effect.gen(function* () {
  const run = Effect.runForkWith(yield* Effect.context<Workspaces | Entries>());
  parentPort.on("message", ({ data, ports: [port] }) => {
    if (port) run(serve(port, WorkspaceServerLive(decodeConnect(data).actor)));
  });
  yield* Effect.logInfo("host ready");
  return yield* Effect.never;
}).pipe(Effect.provide(HostLive));

NodeRuntime.runMain(program);
