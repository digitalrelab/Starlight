import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/rpc";

export const PixelSample = Schema.Struct({
  width: Schema.Number,
  height: Schema.Number,
  rgba: Schema.Uint8Array,
});
export type PixelSample = typeof PixelSample.Type;

export class ImagingRpcs extends RpcGroup.make(
  Rpc.make("SamplePixels", {
    payload: { path: Schema.String },
    success: Schema.NullOr(PixelSample),
  }),
) {}
