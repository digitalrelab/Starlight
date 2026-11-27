import { Base64 } from "effect/encoding";
import { rgbaToThumbHash } from "thumbhash";
import type { ProcessedFacts, Processor } from "./ports.ts";

export const processors: { readonly [F in keyof ProcessedFacts]: Processor<ProcessedFacts[F]> } = {
  placeholder: {
    version: 1,
    process: ({ width, height, rgba }) => Base64.encode(rgbaToThumbHash(width, height, rgba)),
  },
};
