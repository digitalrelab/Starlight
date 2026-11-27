import { mediaTypeOf } from "@starlight/contracts";
import { type CustomScheme, nativeImage, screen } from "electron";
import { fitPreviewSize, PREVIEW_SCHEME } from "#shared/previews.ts";
import { appData } from "./app-data.ts";
import { serveLocalFiles } from "./local-files.ts";
import { createPreviewCache, type PreviewCache } from "./preview-cache.ts";

const JPEG_QUALITY = 85;
const CACHE_LIMIT_BYTES = 2 * 1000 ** 3;
const OPAQUE_TYPES = new Set(["image/jpeg", "image/heic", "image/heif"]);

export const previewScheme: CustomScheme = {
  scheme: PREVIEW_SCHEME,
  privileges: { standard: true, secure: true },
};

const isOpaque = (absolute: string) => OPAQUE_TYPES.has(mediaTypeOf(absolute) ?? "");

const render = async (absolute: string, pixels: number) => {
  const points = Math.ceil(pixels / screen.getPrimaryDisplay().scaleFactor);
  const image = await nativeImage.createThumbnailFromPath(absolute, { width: points, height: points });
  if (image.isEmpty()) return null;
  return new Uint8Array(isOpaque(absolute) ? image.toJPEG(JPEG_QUALITY) : image.toPNG());
};

export const openPreviewCache = () => {
  const cache = createPreviewCache(appData().previews, CACHE_LIMIT_BYTES);
  void cache.prune();
  return cache;
};

export const servePreviews = (key: Buffer, cache: PreviewCache) =>
  serveLocalFiles(PREVIEW_SCHEME, key, async ({ path, version }, request) => {
    const size = fitPreviewSize(Number(new URL(request.url).searchParams.get("size")));
    const bytes = await cache.resolve(JSON.stringify([path, version, size]), () => render(path, size));
    if (!bytes) return new Response(null, { status: 404 });
    return new Response(bytes, {
      headers: {
        "content-type": isOpaque(path) ? "image/jpeg" : "image/png",
        "cache-control": "max-age=31536000, immutable",
      },
    });
  });
