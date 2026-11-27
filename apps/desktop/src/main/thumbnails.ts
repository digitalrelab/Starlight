import { randomBytes } from "node:crypto";
import { extname } from "node:path";
import { verifyThumbnailToken } from "@starlight/host/thumbnail-token";
import { nativeImage, protocol, screen } from "electron";
import { fitThumbnailSize, THUMBNAIL_SCHEME } from "../shared/thumbnails.ts";

const CONCURRENCY = 6;
const JPEG_QUALITY = 85;
const OPAQUE_EXTENSIONS = new Set([".jpg", ".jpeg", ".heic", ".heif"]);

export const thumbnailKey = randomBytes(32);

export const registerThumbnailScheme = () =>
  protocol.registerSchemesAsPrivileged([
    { scheme: THUMBNAIL_SCHEME, privileges: { standard: true, secure: true } },
  ]);

const createLifoQueue = (concurrency: number) => {
  const pending: Array<() => void> = [];
  let active = 0;
  const drain = () => {
    while (active < concurrency) {
      const job = pending.pop();
      if (!job) return;
      active++;
      job();
    }
  };
  return <A>(task: () => Promise<A>, signal: AbortSignal) =>
    new Promise<A>((resolve, reject) => {
      pending.push(() => {
        const settle = signal.aborted ? Promise.reject(signal.reason) : task();
        void settle.then(resolve, reject).finally(() => {
          active--;
          drain();
        });
      });
      drain();
    });
};

const render = async (absolute: string, pixels: number) => {
  const points = Math.ceil(pixels / screen.getPrimaryDisplay().scaleFactor);
  const image = await nativeImage.createThumbnailFromPath(absolute, { width: points, height: points });
  if (image.isEmpty()) return new Response(null, { status: 404 });
  const opaque = OPAQUE_EXTENSIONS.has(extname(absolute).toLowerCase());
  return new Response(new Uint8Array(opaque ? image.toJPEG(JPEG_QUALITY) : image.toPNG()), {
    headers: {
      "content-type": opaque ? "image/jpeg" : "image/png",
      "cache-control": "max-age=31536000, immutable",
    },
  });
};

export const serveThumbnails = () => {
  const enqueue = createLifoQueue(CONCURRENCY);
  protocol.handle(THUMBNAIL_SCHEME, (request) => {
    const url = new URL(request.url);
    const absolute = verifyThumbnailToken(thumbnailKey, url.pathname.slice(1));
    if (!absolute) return new Response(null, { status: 403 });
    const size = fitThumbnailSize(Number(url.searchParams.get("size")) || 0);
    return enqueue(() => render(absolute, size), request.signal).catch(
      () => new Response(null, { status: 404 }),
    );
  });
};
