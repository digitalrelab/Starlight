import type { PixelSample, Property } from "@starlight/contracts";
import { FULL_ALPHA, forEachPixel, OPAQUE_ALPHA } from "./pixels.ts";

const CHROMA_TOLERANCE = 6;
const COLORED_SHARE = 0.01;

const trait = (key: string): Property => ({ namespace: "pixels", key, value: true });

export const traitsOf = (sample: PixelSample): ReadonlyArray<Property> => {
  let transparent = false;
  let opaque = 0;
  let colored = 0;
  forEachPixel(sample, (red, green, blue, alpha) => {
    if (alpha < FULL_ALPHA) transparent = true;
    if (alpha < OPAQUE_ALPHA) return;
    opaque++;
    if (Math.max(red, green, blue) - Math.min(red, green, blue) > CHROMA_TOLERANCE) colored++;
  });
  const monochrome = opaque > 0 && colored <= opaque * COLORED_SHARE;
  return [...(transparent ? [trait("transparent")] : []), ...(monochrome ? [trait("monochrome")] : [])];
};
