import { createHmac, timingSafeEqual } from "node:crypto";
import { EntryRef } from "@starlight/contracts";
import { Option, Schema } from "effect";

const decodeRef = Schema.decodeUnknownOption(Schema.fromJsonString(EntryRef));

const sign = (key: Buffer, payload: string) => createHmac("sha256", key).update(payload).digest();

export const issueFileToken = (key: Buffer, ref: EntryRef, version: number) => {
  const payload = `${Buffer.from(JSON.stringify(ref)).toString("base64url")}.${Math.trunc(version).toString(36)}`;
  return `${payload}.${sign(key, payload).toString("base64url")}`;
};

export const verifyFileToken = (key: Buffer, token: string): EntryRef | null => {
  const separator = token.lastIndexOf(".");
  if (separator < 0) return null;
  const payload = token.slice(0, separator);
  const signature = Buffer.from(token.slice(separator + 1), "base64url");
  const expected = sign(key, payload);
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return null;
  const encoded = Buffer.from(payload.slice(0, payload.indexOf(".")), "base64url").toString();
  return Option.getOrNull(decodeRef(encoded));
};
