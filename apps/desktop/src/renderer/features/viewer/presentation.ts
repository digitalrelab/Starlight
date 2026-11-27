import { type FileSource, mediaTypeOf } from "@starlight/client";
import { fileUrl } from "../../../shared/files.ts";
import { thumbnailUrl } from "../../../shared/thumbnails.ts";

type Presentation = "image" | "rendition" | "video" | "none";

const RENDERED_TYPES = new Set(["image/heic", "image/heif", "image/tiff"]);

export const presentationOf = (name: string): Presentation => {
  const type = mediaTypeOf(name);
  if (type === undefined) return "none";
  if (type.startsWith("video/")) return "video";
  return RENDERED_TYPES.has(type) ? "rendition" : "image";
};

const screenPixels = () => Math.max(window.screen.width, window.screen.height) * window.devicePixelRatio;

export const pictureUrl = ({ token }: FileSource, presentation: "image" | "rendition") =>
  presentation === "image" ? fileUrl(token) : thumbnailUrl(token, screenPixels());
