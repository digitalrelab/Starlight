import { Option, Schema } from "effect";
import { ChatId } from "./chat.ts";
import { EntryKind } from "./entry.ts";
import { EntryRef, ProjectId } from "./ids.ts";

export const Reference = Schema.Union([
  Schema.TaggedStruct("Entry", { ref: EntryRef }),
  Schema.TaggedStruct("Chat", { id: ChatId }),
]);
export type Reference = typeof Reference.Type;

const SCHEME = "starchive:";
const REFERENCE_URL = /^starchive:(entry|chat)\/(.+)$/;
const decodeReference = Schema.decodeUnknownOption(Reference);

export const referenceUrl = (reference: Reference) =>
  reference._tag === "Entry"
    ? `${SCHEME}entry/${encodeURIComponent(reference.ref.source)}/${encodeURIComponent(reference.ref.id)}`
    : `${SCHEME}chat/${encodeURIComponent(reference.id)}`;

const segmentsOf = (path: string) => {
  try {
    return path.split("/").map(decodeURIComponent);
  } catch {
    return [];
  }
};

export const referenceOf = (url: string): Reference | undefined => {
  const [, kind, path = ""] = REFERENCE_URL.exec(url) ?? [];
  const segments = segmentsOf(path);
  const candidate =
    kind === "entry" && segments.length === 2
      ? { _tag: "Entry", ref: { source: segments[0], id: segments[1] } }
      : kind === "chat" && segments.length === 1
        ? { _tag: "Chat", id: segments[0] }
        : undefined;
  return Option.getOrUndefined(decodeReference(candidate));
};

export const EntryLocation = Schema.Struct({
  name: Schema.String,
  kind: EntryKind,
  project: Schema.NullOr(ProjectId),
  directory: EntryRef,
});
export type EntryLocation = typeof EntryLocation.Type;
