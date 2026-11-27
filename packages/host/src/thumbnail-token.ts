import { createHmac, timingSafeEqual } from "node:crypto";
import { EntryRef } from "@starlight/contracts";
import { Option, Schema } from "effect";

const decodeRef = Schema.decodeUnknownOption(Schema.fromJsonString(EntryRef));

const sign = (key: Buffer, payload: string) => createHmac("sha256", key).update(payload).digest();

export const issueThumbnailToken = (key: Buffer, ref: EntryRef, version: number) => {
  const payload = `${Buffer.from(JSON.stringify(ref)).toString("base64url")}.${Math.trunc(version).toString(36)}`;
  return `${payload}.${sign(key, payload).toString("base64url")}`;
};

export interface ThumbnailClaim {
  readonly ref: EntryRef;
  readonly version: number;
}

export const verifyThumbnailToken = (key: Buffer, token: string): ThumbnailClaim | null => {
  const separator = token.lastIndexOf(".");
  if (separator < 0) return null;
  const payload = token.slice(0, separator);
  const signature = Buffer.from(token.slice(separator + 1), "base64url");
  const expected = sign(key, payload);
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return null;
  const [encodedRef = "", encodedVersion = ""] = payload.split(".");
  return Option.match(decodeRef(Buffer.from(encodedRef, "base64url").toString()), {
    onNone: () => null,
    onSome: (ref) => ({ ref, version: Number.parseInt(encodedVersion, 36) }),
  });
};
