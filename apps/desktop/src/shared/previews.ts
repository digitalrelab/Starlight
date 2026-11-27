const LARGEST_SIZE = 2048;
const SIZES = [256, 512, 1024, LARGEST_SIZE] as const;

export const PREVIEW_SCHEME = "starlight-preview";

export const fitPreviewSize = (pixels: number) => SIZES.find((size) => size >= pixels) ?? LARGEST_SIZE;

export const previewUrl = (token: string, pixels: number) =>
  `${PREVIEW_SCHEME}://local/${token}?size=${fitPreviewSize(pixels)}`;
