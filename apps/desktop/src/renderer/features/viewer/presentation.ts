import { File01Icon, FileTextIcon, Image01Icon, Video01Icon } from "@hugeicons-pro/core-stroke-rounded";
import type { Entry, FileSource } from "@starlight/client";
import { fileUrl } from "../../../shared/files.ts";
import { mediaTypeOf } from "../../../shared/media-types.ts";
import { thumbnailUrl } from "../../../shared/thumbnails.ts";

type Presentation = "image" | "rendition" | "video" | "markdown" | "none";

const MAX_MARKDOWN_BYTES = 16 * 1024 ** 2;

const RENDERED_TYPES = new Set(["image/heic", "image/heif", "image/tiff"]);

export const presentationOf = ({ name, size }: Entry): Presentation => {
  const type = mediaTypeOf(name);
  if (type === undefined) return "none";
  if (type === "text/markdown") return size > MAX_MARKDOWN_BYTES ? "none" : "markdown";
  if (type.startsWith("video/")) return "video";
  return RENDERED_TYPES.has(type) ? "rendition" : "image";
};

export const presentationIcons = {
  image: Image01Icon,
  rendition: Image01Icon,
  video: Video01Icon,
  markdown: FileTextIcon,
  none: File01Icon,
} as const;

const screenPixels = () => Math.max(window.screen.width, window.screen.height) * window.devicePixelRatio;

export const pictureUrl = ({ token }: FileSource, presentation: "image" | "rendition") =>
  presentation === "image" ? fileUrl(token) : thumbnailUrl(token, screenPixels());
