import { ImagingRpcs, type PixelSample } from "@starlight/contracts";
import { Context, Effect, Layer, Option } from "effect";
import { RpcClient } from "effect/rpc";
import { layerClientProtocol, type MainPortLike } from "#rpc/transport.ts";

export class Imaging extends Context.Service<
  Imaging,
  { readonly sample: (path: string) => Effect.Effect<Option.Option<PixelSample>> }
>()("@starlight/host/Imaging") {}

export const ImagingLive = (port: () => Promise<MainPortLike>) =>
  Layer.effect(Imaging)(
    Effect.map(RpcClient.make(ImagingRpcs), (client) =>
      Imaging.of({
        sample: (path) =>
          client
            .SamplePixels({ path })
            .pipe(Effect.map(Option.fromNullishOr), Effect.orElseSucceed(Option.none)),
      }),
    ),
  ).pipe(Layer.provide(layerClientProtocol(port)));
