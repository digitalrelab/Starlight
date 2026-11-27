import { createHmac, timingSafeEqual } from "node:crypto";
import { EntryRef, FileId } from "@starlight/contracts";
import { Option, Schema } from "effect";

const decodeRef = Schema.decodeUnknownOption(Schema.fromJsonString(EntryRef));
const decodeFileId = Schema.decodeUnknownOption(FileId);

const sign = (key: Buffer, payload: string) => createHmac("sha256", key).update(payload).digest();

export interface FileClaim {
  readonly ref: EntryRef;
  readonly fileId: FileId;
  readonly version: number;
}

export const issueFileToken = (key: Buffer, { ref, fileId, version }: FileClaim) => {
  const payload = [
    Buffer.from(JSON.stringify(ref)).toString("base64url"),
    fileId,
    Math.trunc(version).toString(36),
  ].join(".");
  return `${payload}.${sign(key, payload).toString("base64url")}`;
};

export const verifyFileToken = (key: Buffer, token: string): FileClaim | null => {
  const separator = token.lastIndexOf(".");
  if (separator < 0) return null;
  const payload = token.slice(0, separator);
  const signature = Buffer.from(token.slice(separator + 1), "base64url");
  const expected = sign(key, payload);
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return null;
  const [encodedRef = "", encodedFileId = "", encodedVersion = ""] = payload.split(".");
  return Option.getOrNull(
    Option.all({
      ref: decodeRef(Buffer.from(encodedRef, "base64url").toString()),
      fileId: decodeFileId(encodedFileId),
      version: Option.some(Number.parseInt(encodedVersion, 36)),
    }),
  );
};
