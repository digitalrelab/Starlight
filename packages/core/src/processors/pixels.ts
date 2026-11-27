import type { PixelSample } from "@starlight/contracts";

const CHANNELS = 4;

export const OPAQUE_ALPHA = 128;
export const FULL_ALPHA = 255;

export const forEachPixel = (
  { rgba }: PixelSample,
  visit: (red: number, green: number, blue: number, alpha: number) => void,
) => {
  for (let offset = 0; offset < rgba.length; offset += CHANNELS) {
    visit(rgba[offset] ?? 0, rgba[offset + 1] ?? 0, rgba[offset + 2] ?? 0, rgba[offset + 3] ?? 0);
  }
};
