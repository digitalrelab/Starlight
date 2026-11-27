import { extname } from "node:path";
import type { Dimensions } from "@starlight/contracts";
import type { Extractor, SourceEntry } from "@starlight/core";
import { Effect, Option } from "effect";
import { IMAGE_EXTENSIONS, readImageDimensions } from "./images/index.ts";
import { readVideoHeader, VIDEO_EXTENSIONS } from "./videos/index.ts";

const extensionOf = (entry: SourceEntry) => extname(entry.id).toLowerCase();

const isReadable = (entry: SourceEntry, extensions: ReadonlySet<string>) =>
  entry.kind === "file" && entry.size > 0 && extensions.has(extensionOf(entry));

const probe = <A>(read: () => Promise<A | null>) =>
  Effect.tryPromise(read).pipe(
    Effect.orElseSucceed(() => null),
    Effect.map(Option.fromNullishOr),
  );

export const dimensionsExtractor: Extractor<Dimensions> = {
  version: 1,
  accepts: (entry) => isReadable(entry, IMAGE_EXTENSIONS) || isReadable(entry, VIDEO_EXTENSIONS),
  extract: (entry) =>
    probe(async () =>
      IMAGE_EXTENSIONS.has(extensionOf(entry))
        ? readImageDimensions(entry.id, entry.size)
        : ((await readVideoHeader(entry.id, entry.size))?.dimensions ?? null),
    ),
};

export const durationExtractor: Extractor<number> = {
  version: 1,
  accepts: (entry) => isReadable(entry, VIDEO_EXTENSIONS),
  extract: (entry) => probe(async () => (await readVideoHeader(entry.id, entry.size))?.duration ?? null),
};
