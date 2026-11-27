import { Effect, Layer, Queue, Schema } from "effect";
import { RpcClient } from "effect/rpc";
import type { FromServerEncoded } from "effect/rpc/RpcMessage";

/** One client per port. Messages are structured-cloned; no serialization layer. */
export const layerProtocolPort = (acquire: () => Promise<MessagePort>) =>
  Layer.effect(RpcClient.Protocol)(
    RpcClient.Protocol.make(
      Effect.fnUntraced(function* (writeResponse, clientIds) {
        const port = yield* Effect.promise(acquire);
        const inbox = yield* Queue.unbounded<FromServerEncoded>();
        port.onmessage = (event: MessageEvent<FromServerEncoded>) => {
          Queue.offerUnsafe(inbox, event.data);
        };
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
