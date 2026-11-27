import { type FileSource, mediaTypeOf } from "@starlight/client";
import { fileUrl } from "../../../shared/files.ts";
import { previewUrl } from "../../../shared/previews.ts";

type Presentation = "image" | "preview" | "video" | "none";

const PREVIEW_ONLY_TYPES = new Set(["image/heic", "image/heif", "image/tiff"]);

export const presentationOf = (name: string): Presentation => {
  const type = mediaTypeOf(name);
  if (type === undefined) return "none";
  if (type.startsWith("video/")) return "video";
  return PREVIEW_ONLY_TYPES.has(type) ? "preview" : "image";
};

const screenPixels = () => Math.max(window.screen.width, window.screen.height) * window.devicePixelRatio;

export const pictureUrl = ({ token }: FileSource, presentation: "image" | "preview") =>
  presentation === "image" ? fileUrl(token) : previewUrl(token, screenPixels());
