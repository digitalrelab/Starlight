const SIZES = [256, 512, 1024] as const;
const LARGEST = 1024;

export type ThumbnailSize = (typeof SIZES)[number];

export const THUMBNAIL_SCHEME = "starlight-thumbnail";

export const fitThumbnailSize = (pixels: number): ThumbnailSize =>
  SIZES.find((size) => size >= pixels) ?? LARGEST;

export const thumbnailUrl = (token: string, pixels: number) =>
  `${THUMBNAIL_SCHEME}://local/${token}?size=${fitThumbnailSize(pixels)}`;
