import { type Entry, type FileSource, mediaTypeOf } from "@starlight/client";
import { fileUrl } from "#shared/files.ts";
import { previewUrl } from "#shared/previews.ts";

type Presentation = "image" | "preview" | "video" | "audio" | "markdown" | "text" | "none";

const MAX_TEXT_BYTES = 16 * 1024 ** 2;

const PREVIEW_ONLY_TYPES = new Set(["image/heic", "image/heif", "image/tiff"]);

export const presentationOf = ({ name, size }: Entry): Presentation => {
  const type = mediaTypeOf(name);
  if (type === undefined) return size > MAX_TEXT_BYTES ? "none" : "text";
  if (type === "text/markdown") return size > MAX_TEXT_BYTES ? "none" : "markdown";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  return PREVIEW_ONLY_TYPES.has(type) ? "preview" : "image";
};

const screenPixels = () => Math.max(window.screen.width, window.screen.height) * window.devicePixelRatio;

export const pictureUrl = ({ token }: FileSource, presentation: "image" | "preview") =>
  presentation === "image" ? fileUrl(token) : previewUrl(token, screenPixels());
