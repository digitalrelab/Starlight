import { createHmac, timingSafeEqual } from "node:crypto";

const sign = (key: Buffer, payload: string) => createHmac("sha256", key).update(payload).digest();

export const issueThumbnailToken = (key: Buffer, absolute: string, version: number) => {
  const payload = `${Buffer.from(absolute).toString("base64url")}.${Math.trunc(version).toString(36)}`;
  return `${payload}.${sign(key, payload).toString("base64url")}`;
};

export const verifyThumbnailToken = (key: Buffer, token: string): string | null => {
  const separator = token.lastIndexOf(".");
  if (separator < 0) return null;
  const payload = token.slice(0, separator);
  const signature = Buffer.from(token.slice(separator + 1), "base64url");
  const expected = sign(key, payload);
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return null;
  return Buffer.from(payload.slice(0, payload.indexOf(".")), "base64url").toString();
};
