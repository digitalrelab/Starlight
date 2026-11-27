import { type FileHandle, open } from "node:fs/promises";
import { extname } from "node:path";
import type { Dimensions } from "@starlight/core";
import { Effect, Option } from "effect";
import { imageSize } from "image-size";
import { locateHeifExif, readExifItemOrientation } from "./heif-exif.ts";

const EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
  ".heic",
  ".heif",
  ".bmp",
  ".tif",
  ".tiff",
]);
const HEIF_TYPES = new Set(["heif", "heic", "avif"]);
const ROTATED_ORIENTATIONS = new Set([5, 6, 7, 8]);
const READ_STEPS = [64 * 1024, 1024 * 1024] as const;
const EXIF_ITEM_LIMIT = 64 * 1024;
const CACHE_LIMIT = 100_000;

export interface ProbeTarget {
  readonly absolute: string;
  readonly size: number;
  readonly modifiedAt: number;
}

interface Cached {
  readonly size: number;
  readonly modifiedAt: number;
  readonly dimensions: Dimensions | null;
}

const measure = (bytes: Uint8Array) => {
  try {
    const { width, height, orientation, type } = imageSize(bytes);
    return width && height ? { width, height, orientation, type } : null;
  } catch {
    return null;
  }
};

const readRange = async (handle: FileHandle, offset: number, length: number) => {
  const buffer = new Uint8Array(length);
  const { bytesRead } = await handle.read(buffer, 0, length, offset);
  return buffer.subarray(0, bytesRead);
};

const heifOrientation = async (handle: FileHandle, header: Uint8Array) => {
  const exif = locateHeifExif(header);
  if (!exif) return undefined;
  return readExifItemOrientation(
    await readRange(handle, exif.offset, Math.min(exif.length, EXIF_ITEM_LIMIT)),
  );
};

const read = async ({ absolute, size }: ProbeTarget): Promise<Dimensions | null> => {
  const handle = await open(absolute, "r");
  try {
    for (const step of READ_STEPS) {
      const header = await readRange(handle, 0, Math.min(step, size));
      const measured = measure(header);
      if (measured) {
        const orientation =
          measured.type && HEIF_TYPES.has(measured.type) && (measured.orientation ?? 1) === 1
            ? await heifOrientation(handle, header)
            : measured.orientation;
        return orientation && ROTATED_ORIENTATIONS.has(orientation)
          ? { width: measured.height, height: measured.width }
          : { width: measured.width, height: measured.height };
      }
      if (header.length === size) break;
    }
    return null;
  } finally {
    await handle.close();
  }
};

export const createImageProbe = () => {
  const cache = new Map<string, Cached>();

  const remember = (target: ProbeTarget, dimensions: Dimensions | null) => {
    cache.delete(target.absolute);
    cache.set(target.absolute, { size: target.size, modifiedAt: target.modifiedAt, dimensions });
    if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
    return dimensions;
  };

  return (target: ProbeTarget): Effect.Effect<Option.Option<Dimensions>> => {
    if (target.size === 0 || !EXTENSIONS.has(extname(target.absolute).toLowerCase()))
      return Effect.succeedNone;
    const hit = cache.get(target.absolute);
    if (hit && hit.size === target.size && hit.modifiedAt === target.modifiedAt)
      return Effect.succeed(Option.fromNullOr(hit.dimensions));
    return Effect.tryPromise(() => read(target)).pipe(
      Effect.orElseSucceed(() => null),
      Effect.map((dimensions) => Option.fromNullOr(remember(target, dimensions))),
    );
  };
};
