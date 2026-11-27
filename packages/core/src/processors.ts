import { Base64 } from "effect/encoding";
import { rgbaToThumbHash } from "thumbhash";
import type { PixelSample } from "@starlight/contracts";
import type { ProcessedFacts, Processor } from "./ports.ts";

export const processors: { readonly [F in keyof ProcessedFacts]: Processor<ProcessedFacts[F]> } = {
  placeholder: {
    version: 1,
    process: ({ width, height, rgba }) => Base64.encode(rgbaToThumbHash(width, height, rgba)),
  },
};

export const processedNames = Object.keys(processors) as ReadonlyArray<keyof ProcessedFacts>;

export const processSample = (sample: PixelSample): ProcessedFacts => ({
  placeholder: processors.placeholder.process(sample),
});
