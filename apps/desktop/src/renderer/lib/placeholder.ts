import { thumbHashToDataURL } from "thumbhash";

const CACHE_LIMIT = 1024;

const urls = new Map<string, string>();

export const placeholderUrl = (hash: string) => {
  const cached = urls.get(hash);
  if (cached) return cached;
  const url = thumbHashToDataURL(Uint8Array.from(atob(hash), (char) => char.charCodeAt(0)));
  urls.set(hash, url);
  if (urls.size > CACHE_LIMIT) urls.delete(urls.keys().next().value as string);
  return url;
};
