import { ImagingRpcs, type PixelSample, SampleFailed } from "@starlight/contracts";
import { serve } from "@starlight/host/transport";
import { type MessagePortMain, nativeImage, screen } from "electron";
import { Effect, Layer } from "effect";
import { RpcServer } from "effect/rpc";

const SAMPLE_EDGE = 100;
const OPAQUE = 255;

const toRgba = (bgra: Buffer) => {
  const rgba = new Uint8Array(bgra.length);
  for (let offset = 0; offset < bgra.length; offset += 4) {
    const alpha = bgra[offset + 3] ?? 0;
    const scale = alpha === 0 ? 0 : OPAQUE / alpha;
    rgba[offset] = Math.min(OPAQUE, Math.round((bgra[offset + 2] ?? 0) * scale));
    rgba[offset + 1] = Math.min(OPAQUE, Math.round((bgra[offset + 1] ?? 0) * scale));
    rgba[offset + 2] = Math.min(OPAQUE, Math.round((bgra[offset] ?? 0) * scale));
    rgba[offset + 3] = alpha;
  }
  return rgba;
};

const sample = async (path: string): Promise<PixelSample | null> => {
  const points = Math.ceil(SAMPLE_EDGE / screen.getPrimaryDisplay().scaleFactor);
  const thumbnail = await nativeImage.createThumbnailFromPath(path, { width: points, height: points });
  if (thumbnail.isEmpty()) return null;
  const pixels = nativeImage.createFromBuffer(thumbnail.toPNG());
  const natural = pixels.getSize();
  const fit = Math.min(1, SAMPLE_EDGE / Math.max(natural.width, natural.height));
  const image = pixels.resize({
    width: Math.max(1, Math.round(natural.width * fit)),
    height: Math.max(1, Math.round(natural.height * fit)),
    quality: "good",
  });
  const { width, height } = image.getSize();
  return { width, height, rgba: toRgba(image.toBitmap()) };
};

const ImagingServerLive = RpcServer.layer(ImagingRpcs).pipe(
  Layer.provide(
    ImagingRpcs.toLayer({
      SamplePixels: ({ path }) =>
        Effect.tryPromise({ try: () => sample(path), catch: () => new SampleFailed() }),
    }),
  ),
);

export const serveImaging = (port: MessagePortMain) => Effect.runFork(serve(port, ImagingServerLive));
