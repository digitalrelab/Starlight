import { extname, join } from "node:path";
import { LocalSource } from "@starlight/contracts";
import { verifyThumbnailToken } from "@starlight/host/thumbnail-token";
import { app, nativeImage, protocol, screen } from "electron";
import { fitThumbnailSize, THUMBNAIL_SCHEME } from "../shared/thumbnails.ts";
import { createThumbnailCache } from "./thumbnail-cache.ts";

const JPEG_QUALITY = 85;
const CACHE_LIMIT_BYTES = 2 * 1024 ** 3;
const OPAQUE_EXTENSIONS = new Set([".jpg", ".jpeg", ".heic", ".heif"]);

const isOpaque = (absolute: string) => OPAQUE_EXTENSIONS.has(extname(absolute).toLowerCase());

export const registerThumbnailScheme = () =>
  protocol.registerSchemesAsPrivileged([
    { scheme: THUMBNAIL_SCHEME, privileges: { standard: true, secure: true } },
  ]);

const render = async (absolute: string, pixels: number) => {
  const points = Math.ceil(pixels / screen.getPrimaryDisplay().scaleFactor);
  const image = await nativeImage.createThumbnailFromPath(absolute, { width: points, height: points });
  if (image.isEmpty()) return null;
  return new Uint8Array(isOpaque(absolute) ? image.toJPEG(JPEG_QUALITY) : image.toPNG());
};

export const serveThumbnails = (key: Buffer) => {
  const cache = createThumbnailCache(join(app.getPath("userData"), "thumbnails"), CACHE_LIMIT_BYTES);
  void cache.prune();
  protocol.handle(THUMBNAIL_SCHEME, async (request) => {
    const url = new URL(request.url);
    const claim = verifyThumbnailToken(key, url.pathname.slice(1));
    if (!claim) return new Response(null, { status: 403 });
    const { ref, version } = claim;
    if (ref.source !== LocalSource) return new Response(null, { status: 404 });
    const size = fitThumbnailSize(Number(url.searchParams.get("size")));
    const bytes = await cache
      .resolve(JSON.stringify([ref.source, ref.id, version, size]), () => render(ref.id, size))
      .catch(() => null);
    if (!bytes) return new Response(null, { status: 404 });
    return new Response(bytes, {
      headers: {
        "content-type": isOpaque(ref.id) ? "image/jpeg" : "image/png",
        "cache-control": "max-age=31536000, immutable",
      },
    });
  });
};
