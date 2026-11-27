import { createHmac, timingSafeEqual } from "node:crypto";
import { EntryRef, FileId, FileVersion } from "@starlight/contracts";
import { Option, Schema } from "effect";

const FileClaim = Schema.Struct({ ref: EntryRef, fileId: FileId, version: FileVersion });
export type FileClaim = typeof FileClaim.Type;

const ClaimJson = Schema.fromJsonString(FileClaim);
const encodeClaim = Schema.encodeSync(ClaimJson);
const decodeClaim = Schema.decodeUnknownOption(ClaimJson);

const sign = (key: Buffer, payload: string) => createHmac("sha256", key).update(payload).digest();

export const issueFileToken = (key: Buffer, claim: FileClaim) => {
  const payload = Buffer.from(encodeClaim(claim)).toString("base64url");
  return `${payload}.${sign(key, payload).toString("base64url")}`;
};

export const verifyFileToken = (key: Buffer, token: string): FileClaim | null => {
  const separator = token.lastIndexOf(".");
  if (separator < 0) return null;
  const payload = token.slice(0, separator);
  const signature = Buffer.from(token.slice(separator + 1), "base64url");
  const expected = sign(key, payload);
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return null;
  return Option.getOrNull(decodeClaim(Buffer.from(payload, "base64url").toString()));
};
