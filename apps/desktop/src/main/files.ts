import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import type { CustomScheme } from "electron";
import { FILE_SCHEME } from "../shared/files.ts";
import { mediaTypeOf } from "../shared/media-types.ts";
import { serveLocalFiles } from "./local-files.ts";

const RANGE = /^bytes=(\d*)-(\d*)$/;

export const fileScheme: CustomScheme = {
  scheme: FILE_SCHEME,
  privileges: { standard: true, secure: true, stream: true },
};

const byteRange = (header: string | null, size: number) => {
  const match = header === null ? null : RANGE.exec(header);
  if (!match) return undefined;
  const [, first = "", last = ""] = match;
  const start = first === "" ? Math.max(0, size - Number(last)) : Number(first);
  const end = first === "" || last === "" ? size - 1 : Math.min(Number(last), size - 1);
  return start <= end ? { start, end } : null;
};

const respond = async (absolute: string, range: string | null) => {
  const { size } = await stat(absolute);
  const requested = byteRange(range, size);
  if (requested === null) {
    return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
  }
  const { start, end } = requested ?? { start: 0, end: size - 1 };
  const headers = new Headers({
    "accept-ranges": "bytes",
    "cache-control": "max-age=31536000, immutable",
    "content-length": String(end - start + 1),
    "content-type": mediaTypeOf(absolute) ?? "application/octet-stream",
  });
  if (requested) headers.set("content-range", `bytes ${start}-${end}/${size}`);
  const body = size === 0 ? null : Readable.toWeb(createReadStream(absolute, { start, end }));
  return new Response(body as ReadableStream<Uint8Array> | null, { status: requested ? 206 : 200, headers });
};

export const serveFiles = (key: Buffer) =>
  serveLocalFiles(FILE_SCHEME, key, (path, request) => respond(path, request.headers.get("range")));
