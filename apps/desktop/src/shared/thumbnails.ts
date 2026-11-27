const LARGEST_SIZE = 2048;
const SIZES = [256, 512, 1024, LARGEST_SIZE] as const;

export const THUMBNAIL_SCHEME = "starlight-thumbnail";

export const fitThumbnailSize = (pixels: number) => SIZES.find((size) => size >= pixels) ?? LARGEST_SIZE;

export const thumbnailUrl = (token: string, pixels: number) =>
  `${THUMBNAIL_SCHEME}://local/${token}?size=${fitThumbnailSize(pixels)}`;
