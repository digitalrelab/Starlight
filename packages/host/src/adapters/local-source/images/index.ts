import { type FileHandle, open } from "node:fs/promises";
import type { Dimensions } from "@starlight/contracts";
import { imageSize } from "image-size";
import { readRange } from "#adapters/local-source/read-range.ts";
import { locateHeifExif, readExifItemOrientation } from "./heif-exif.ts";

export const IMAGE_EXTENSIONS = new Set([
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

const measure = (bytes: Uint8Array) => {
  try {
    const { width, height, orientation, type } = imageSize(bytes);
    return width && height ? { width, height, orientation, type } : null;
  } catch {
    return null;
  }
};

const heifOrientation = async (handle: FileHandle, header: Uint8Array) => {
  const exif = locateHeifExif(header);
  if (!exif) return undefined;
  return readExifItemOrientation(
    await readRange(handle, exif.offset, Math.min(exif.length, EXIF_ITEM_LIMIT)),
  );
};

export const readImageDimensions = async (path: string, size: number): Promise<Dimensions | null> => {
  const handle = await open(path, "r");
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
