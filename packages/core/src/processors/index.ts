import type { PixelSample } from "@starlight/contracts";
import { Base64 } from "effect/encoding";
import { rgbaToThumbHash } from "thumbhash";
import type { ProcessedFacts, Processor } from "#ports.ts";
import { paletteOf } from "./palette.ts";
import { isTransparent } from "./pixels.ts";
import { traitsOf } from "./traits.ts";

export const processors: { readonly [F in keyof ProcessedFacts]: Processor<ProcessedFacts[F]> } = {
  placeholder: {
    version: 2,
    process: (sample) =>
      isTransparent(sample) ? null : Base64.encode(rgbaToThumbHash(sample.width, sample.height, sample.rgba)),
  },
  palette: { version: 1, process: paletteOf },
  traits: { version: 1, process: traitsOf },
};

export const processedNames = Object.keys(processors) as ReadonlyArray<keyof ProcessedFacts>;

export const processSample = (sample: PixelSample): ProcessedFacts => ({
  placeholder: processors.placeholder.process(sample),
  palette: processors.palette.process(sample),
  traits: processors.traits.process(sample),
});
