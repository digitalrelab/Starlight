import { Effect, Layer, Queue, Schema } from "effect";
import { RpcServer } from "effect/rpc";
import type { FromClientEncoded } from "effect/rpc/RpcMessage";

/** Structural subset of Electron's `MessagePortMain`, so this module stays Electron-free. */
export interface MainPortLike {
  on(event: "message", listener: (event: { data: unknown }) => void): unknown;
  on(event: "close", listener: () => void): unknown;
  postMessage(message: unknown): void;
  start(): void;
  close(): void;
}

const CLIENT_ID = 0;

/** One port = one client. Messages are structured-cloned; no serialization layer. */
const layerProtocol = (port: MainPortLike) =>
  Layer.effect(RpcServer.Protocol)(
    RpcServer.Protocol.make(
      Effect.fnUntraced(function* (writeRequest) {
        const inbox = yield* Queue.unbounded<FromClientEncoded>();
        port.on("message", (event) => {
          Queue.offerUnsafe(inbox, event.data as FromClientEncoded);
        });
        port.start();
        yield* Queue.take(inbox).pipe(
          Effect.flatMap((message) => writeRequest(CLIENT_ID, message)),
          Effect.forever,
          Effect.forkScoped,
        );

        return {
          disconnects: yield* Queue.unbounded<number>(),
          send: (_clientId, response) => Effect.sync(() => port.postMessage(response)),
          end: () => Effect.void,
          clientIds: Effect.succeed(new Set([CLIENT_ID])),
          initialMessage: Effect.succeedNone,
          supportsAck: true,
          supportsTransferables: false,
          supportsSpanPropagation: true,
          supportsNotifications: false,
          codecFor: Schema.toCodecJson,
        };
      }),
    ),
  );

/** Runs an RPC server over `port` until either side closes it. */
export const serve = <E, R>(port: MainPortLike, server: Layer.Layer<never, E, R | RpcServer.Protocol>) =>
  Effect.raceFirst(
    Layer.launch(server.pipe(Layer.provide(layerProtocol(port)))),
    Effect.callback<void>((resume) => {
      port.on("close", () => resume(Effect.void));
    }),
  ).pipe(Effect.ensuring(Effect.sync(() => port.close())));
