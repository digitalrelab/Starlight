import { join } from "node:path";
import { app, type CustomScheme, nativeImage, screen } from "electron";
import { mediaTypeOf } from "../shared/media-types.ts";
import { fitThumbnailSize, THUMBNAIL_SCHEME } from "../shared/thumbnails.ts";
import { serveLocalFiles } from "./local-files.ts";
import { createThumbnailCache, type ThumbnailCache } from "./thumbnail-cache.ts";

const JPEG_QUALITY = 85;
const CACHE_LIMIT_BYTES = 2 * 1000 ** 3;
const OPAQUE_TYPES = new Set(["image/jpeg", "image/heic", "image/heif"]);

export const thumbnailScheme: CustomScheme = {
  scheme: THUMBNAIL_SCHEME,
  privileges: { standard: true, secure: true },
};

const isOpaque = (absolute: string) => OPAQUE_TYPES.has(mediaTypeOf(absolute) ?? "");

const render = async (absolute: string, pixels: number) => {
  const points = Math.ceil(pixels / screen.getPrimaryDisplay().scaleFactor);
  const image = await nativeImage.createThumbnailFromPath(absolute, { width: points, height: points });
  if (image.isEmpty()) return null;
  return new Uint8Array(isOpaque(absolute) ? image.toJPEG(JPEG_QUALITY) : image.toPNG());
};

export const openThumbnailCache = () => {
  const cache = createThumbnailCache(join(app.getPath("userData"), "thumbnails"), CACHE_LIMIT_BYTES);
  void cache.prune();
  return cache;
};

export const serveThumbnails = (key: Buffer, cache: ThumbnailCache) =>
  serveLocalFiles(THUMBNAIL_SCHEME, key, async ({ path, version }, request) => {
    const size = fitThumbnailSize(Number(new URL(request.url).searchParams.get("size")));
    const bytes = await cache.resolve(JSON.stringify([path, version, size]), () => render(path, size));
    if (!bytes) return new Response(null, { status: 404 });
    return new Response(bytes, {
      headers: {
        "content-type": isOpaque(path) ? "image/jpeg" : "image/png",
        "cache-control": "max-age=31536000, immutable",
      },
    });
  });
