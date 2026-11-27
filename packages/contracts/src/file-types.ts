import { Schema } from "effect";

export const FileKind = Schema.Literals([
  "image",
  "video",
  "audio",
  "pdf",
  "document",
  "markdown",
  "spreadsheet",
  "presentation",
  "design",
  "archive",
  "font",
  "3d",
  "other",
]);
export type FileKind = typeof FileKind.Type;

const KIND_EXTENSIONS: Readonly<Record<Exclude<FileKind, "other">, ReadonlyArray<string>>> = {
  image: [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "avif",
    "heic",
    "heif",
    "tif",
    "tiff",
    "bmp",
    "svg",
    "ico",
    "cr2",
    "cr3",
    "nef",
    "arw",
    "dng",
    "raf",
    "orf",
    "rw2",
  ],
  video: ["mp4", "mov", "m4v", "avi", "mkv", "webm", "wmv", "mpg", "mpeg", "mxf", "r3d", "braw"],
  audio: ["mp3", "wav", "aac", "m4a", "flac", "ogg", "oga", "opus", "aif", "aiff", "wma"],
  pdf: ["pdf"],
  document: ["doc", "docx", "dot", "dotx", "odt", "rtf", "txt", "pages", "epub"],
  markdown: ["md", "markdown"],
  spreadsheet: ["xls", "xlsx", "xlsm", "ods", "csv", "tsv", "numbers"],
  presentation: ["ppt", "pptx", "pps", "ppsx", "odp", "key"],
  design: [
    "psd",
    "psb",
    "psdt",
    "ai",
    "ait",
    "eps",
    "indd",
    "indt",
    "idml",
    "sketch",
    "fig",
    "xd",
    "afdesign",
    "afphoto",
    "afpub",
    "cdr",
    "xcf",
    "procreate",
  ],
  archive: ["zip", "rar", "7z", "tar", "gz", "tgz", "bz2", "xz", "zst"],
  font: ["ttf", "otf", "woff", "woff2", "ttc", "eot"],
  "3d": [
    "glb",
    "gltf",
    "obj",
    "fbx",
    "stl",
    "usd",
    "usda",
    "usdc",
    "usdz",
    "blend",
    "3ds",
    "dae",
    "ply",
    "3mf",
    "c4d",
    "skp",
    "max",
    "ma",
    "mb",
  ],
};

const KIND_BY_EXTENSION: ReadonlyMap<string, FileKind> = new Map(
  Object.entries(KIND_EXTENSIONS).flatMap(([kind, extensions]) =>
    extensions.map((extension) => [extension, kind as FileKind] as const),
  ),
);

const MEDIA_TYPES: Readonly<Record<string, string>> = {
  avif: "image/avif",
  bmp: "image/bmp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  tif: "image/tiff",
  tiff: "image/tiff",
  webp: "image/webp",
  m4v: "video/mp4",
  mov: "video/quicktime",
  mp4: "video/mp4",
  webm: "video/webm",
};

const extensionOf = (name: string) => {
  const dot = name.lastIndexOf(".");
  return dot <= 0 ? "" : name.slice(dot + 1).toLowerCase();
};

export const fileKindOf = (name: string): FileKind => KIND_BY_EXTENSION.get(extensionOf(name)) ?? "other";

export const mediaTypeOf = (name: string): string | undefined => MEDIA_TYPES[extensionOf(name)];
