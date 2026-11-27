import { extname } from "node:path";
import { type CustomScheme, nativeImage, screen } from "electron";
import { fitThumbnailSize, THUMBNAIL_SCHEME } from "../shared/thumbnails.ts";
import { serveLocalFiles } from "./local-files.ts";

const CONCURRENCY = 6;
const MAX_POINTS = 1024;
const JPEG_QUALITY = 85;
const OPAQUE_EXTENSIONS = new Set([".jpg", ".jpeg", ".heic", ".heif"]);

export const thumbnailScheme: CustomScheme = {
  scheme: THUMBNAIL_SCHEME,
  privileges: { standard: true, secure: true },
};

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
  return <A>(task: () => Promise<A>) =>
    new Promise<A>((resolve, reject) => {
      pending.push(() => {
        void task()
          .then(resolve, reject)
          .finally(() => {
            active--;
            drain();
          });
      });
      drain();
    });
};

const render = async (absolute: string, pixels: number) => {
  const points = Math.min(MAX_POINTS, Math.ceil(pixels / screen.getPrimaryDisplay().scaleFactor));
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

export const serveThumbnails = (key: Buffer) => {
  const enqueue = createLifoQueue(CONCURRENCY);
  serveLocalFiles(THUMBNAIL_SCHEME, key, (path, request) =>
    enqueue(() => render(path, fitThumbnailSize(Number(new URL(request.url).searchParams.get("size"))))),
  );
};
