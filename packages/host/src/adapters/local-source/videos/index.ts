import { type FileHandle, open } from "node:fs/promises";
import type { Dimensions } from "@starlight/contracts";
import { readRange } from "#adapters/local-source/read-range.ts";

export const VIDEO_EXTENSIONS = new Set([".mp4", ".m4v", ".mov"]);

const BOX_HEADER = 8;
const LARGE_BOX_HEADER = 16;
const MOVIE_LIMIT = 64 * 1024 * 1024;
const FIXED_POINT = 0x10000;

export interface VideoHeader {
  readonly dimensions: Dimensions;
  readonly duration: number | null;
}

interface Box {
  readonly type: string;
  readonly start: number;
  readonly end: number;
}

const typeAt = (bytes: Uint8Array, offset: number) =>
  String.fromCharCode(...bytes.subarray(offset, offset + 4));

const findMovie = async (handle: FileHandle, fileSize: number) => {
  let offset = 0;
  while (offset + BOX_HEADER <= fileSize) {
    const head = await readRange(handle, offset, LARGE_BOX_HEADER);
    const view = new DataView(head.buffer, head.byteOffset, head.byteLength);
    let size = view.getUint32(0);
    let header = BOX_HEADER;
    if (size === 1) {
      size = Number(view.getBigUint64(8));
      header = LARGE_BOX_HEADER;
    } else if (size === 0) size = fileSize - offset;
    if (size < header) return null;
    if (typeAt(head, 4) === "moov") {
      return size - header > MOVIE_LIMIT ? null : readRange(handle, offset + header, size - header);
    }
    offset += size;
  }
  return null;
};

const childrenOf = (bytes: Uint8Array, { start, end }: Pick<Box, "start" | "end">) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const children: Array<Box> = [];
  for (let offset = start; offset + BOX_HEADER <= end;) {
    const size = view.getUint32(offset);
    if (size < BOX_HEADER || offset + size > end) break;
    children.push({ type: typeAt(bytes, offset + 4), start: offset + BOX_HEADER, end: offset + size });
    offset += size;
  }
  return children;
};

const childOf = (bytes: Uint8Array, parent: Pick<Box, "start" | "end">, type: string) =>
  childrenOf(bytes, parent).find((child) => child.type === type);

const UNKNOWN_DURATION_32 = 0xffffffff;
const UNKNOWN_DURATION_64 = 0xffffffffffffffffn;

const durationOf = (view: DataView, header: Box) => {
  const long = view.getUint8(header.start) === 1;
  const timescale = view.getUint32(header.start + (long ? 20 : 12));
  const raw = long ? view.getBigUint64(header.start + 24) : BigInt(view.getUint32(header.start + 16));
  const unknown = raw === 0n || raw === (long ? UNKNOWN_DURATION_64 : BigInt(UNKNOWN_DURATION_32));
  return timescale > 0 && !unknown ? Number(raw) / timescale : null;
};

const displaySizeOf = (view: DataView, header: Box): Dimensions | null => {
  const matrix = header.start + (view.getUint8(header.start) === 1 ? 52 : 40);
  const width = Math.round(view.getUint32(matrix + 36) / FIXED_POINT);
  const height = Math.round(view.getUint32(matrix + 40) / FIXED_POINT);
  if (width === 0 || height === 0) return null;
  const rotated = view.getInt32(matrix) === 0 && view.getInt32(matrix + 16) === 0;
  return rotated ? { width: height, height: width } : { width, height };
};

const isVideoTrack = (bytes: Uint8Array, track: Box) => {
  const media = childOf(bytes, track, "mdia");
  const handler = media && childOf(bytes, media, "hdlr");
  return handler !== undefined && typeAt(bytes, handler.start + 8) === "vide";
};

export const readVideoHeader = async (path: string, size: number): Promise<VideoHeader | null> => {
  const handle = await open(path, "r");
  try {
    const movie = await findMovie(handle, size);
    if (!movie) return null;
    const view = new DataView(movie.buffer, movie.byteOffset, movie.byteLength);
    const root = { start: 0, end: movie.length };
    const header = childOf(movie, root, "mvhd");
    for (const track of childrenOf(movie, root).filter((box) => box.type === "trak")) {
      const trackHeader = childOf(movie, track, "tkhd");
      if (!trackHeader || !isVideoTrack(movie, track)) continue;
      const dimensions = displaySizeOf(view, trackHeader);
      if (dimensions) return { dimensions, duration: header ? durationOf(view, header) : null };
    }
    return null;
  } finally {
    await handle.close();
  }
};
