import { decodeNamedCharacterReference } from "decode-named-character-reference";

const ESCAPED = /\\([!-/:-@[-`{-~])/g;
const SAFE_URL = /^(?:https?|mailto):/i;
const SCHEME = /^[a-z][a-z\d+.-]*:/i;
const REPLACEMENT = "�";

export const unescape = (text: string) => text.replace(ESCAPED, "$1");

export const decodeEntity = (entity: string) => {
  const body = entity.slice(1, -1);
  if (!body.startsWith("#")) return decodeNamedCharacterReference(body) || entity;
  const isHex = body[1] === "x" || body[1] === "X";
  const code = Number.parseInt(body.slice(isHex ? 2 : 1), isHex ? 16 : 10);
  const isScalar = code > 0 && code <= 0x10ffff && (code < 0xd800 || code > 0xdfff);
  return isScalar ? String.fromCodePoint(code) : REPLACEMENT;
};

export const safeUrl = (url: string) => (SAFE_URL.test(url) ? url : undefined);

export const autolinkUrl = (url: string) => {
  if (SCHEME.test(url)) return url;
  return url.includes("@") ? `mailto:${url}` : `https://${url}`;
};

export const referenceKey = (label: string) => label.trim().replace(/\s+/g, " ").toLowerCase();
