import { Effect, Layer, Queue, Schema } from "effect";
import { RpcClient, RpcServer } from "effect/rpc";
import type { FromClientEncoded, FromServerEncoded } from "effect/rpc/RpcMessage";

export interface MainPortLike {
  on(event: "message", listener: (event: { data: unknown }) => void): unknown;
  on(event: "close", listener: () => void): unknown;
  postMessage(message: unknown): void;
  start(): void;
  close(): void;
}

const CLIENT_ID = 0;

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

export const serve = <E, R>(port: MainPortLike, server: Layer.Layer<never, E, R | RpcServer.Protocol>) =>
  Effect.raceFirst(
    Layer.launch(server.pipe(Layer.provide(layerProtocol(port)))),
    Effect.callback<void>((resume) => {
      port.on("close", () => resume(Effect.void));
    }),
  ).pipe(Effect.ensuring(Effect.sync(() => port.close())));

export const layerClientProtocol = (acquire: () => Promise<MainPortLike>) =>
  Layer.effect(RpcClient.Protocol)(
    RpcClient.Protocol.make(
      Effect.fnUntraced(function* (writeResponse, clientIds) {
        const port = yield* Effect.promise(acquire);
        const inbox = yield* Queue.unbounded<FromServerEncoded>();
        port.on("message", (event) => {
          Queue.offerUnsafe(inbox, event.data as FromServerEncoded);
        });
        port.start();
        yield* Effect.addFinalizer(() => Effect.sync(() => port.close()));
        yield* Queue.take(inbox).pipe(
          Effect.flatMap((response) =>
            Effect.forEach(clientIds, (id) => writeResponse(id, response), { discard: true }),
          ),
          Effect.forever,
          Effect.forkScoped,
        );

        return {
          send: (_clientId, request) => Effect.sync(() => port.postMessage(request)),
          supportsAck: true,
          supportsTransferables: false,
          codecFor: Schema.toCodecJson,
        };
      }),
    ),
  );
