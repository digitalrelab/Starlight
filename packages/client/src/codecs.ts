export interface Decoded<T> {
  readonly value: T;
  readonly encode: ((value: T) => Uint8Array) | undefined;
}

export type Codec<T> = (bytes: Uint8Array) => Decoded<T>;

const BOM = "﻿";
const strict = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
const lenient = new TextDecoder("utf-8");
const encoder = new TextEncoder();

const decodeStrictly = (bytes: Uint8Array) => {
  try {
    return strict.decode(bytes);
  } catch {
    return undefined;
  }
};

export const textCodec: Codec<string> = (bytes) => {
  const raw = decodeStrictly(bytes);
  if (raw === undefined) return { value: lenient.decode(bytes), encode: undefined };
  const bom = raw.startsWith(BOM) ? BOM : "";
  const body = raw.slice(bom.length);
  const crlf = body.includes("\r\n");
  return {
    value: crlf ? body.replaceAll("\r\n", "\n") : body,
    encode: (text) => encoder.encode(bom + (crlf ? text.replaceAll("\n", "\r\n") : text)),
  };
};
