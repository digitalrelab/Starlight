import {
  type Entry,
  type EntryRef,
  mediaTypeOf,
  type ProjectId,
  referenceOf,
  referenceUrl,
} from "@starlight/contracts";
import { Context, Data, Effect, Layer, Schema, Stream } from "effect";
import { Base64 } from "effect/encoding";
import { Entries } from "./entries.ts";
import { Files } from "./files.ts";
import type { AgentToolkit, AgentToolResult } from "./ports.ts";

const READ_LIMIT = 4 * 1024 * 1024;
const IMAGE_LIMIT = 3.75 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);
const BINARY_PROBE = 8000;
const LINE_LIMIT = 2000;
const LIST_LIMIT = 500;

const INSTRUCTIONS =
  "This chat belongs to a project. You can read the project's files but not change them. A link like [notes.md](starchive:entry/…) points to a file or folder in it: pass the link to read_file or list_folder. Call list_folder without a link to see the project's folders. When you mention a file or folder, link to it the same way.";

class ToolFailed extends Data.TaggedError("ToolFailed")<{ readonly message: string }> {}

const text = (value: string, failed = false): AgentToolResult => ({
  content: [{ _tag: "Text", text: value }],
  failed,
});

const linkTo = (name: string, ref: EntryRef) =>
  `[${name.replace(/[[\]\\]/g, "\\$&")}](${referenceUrl({ _tag: "Entry", ref })})`;

const entryOf = (link: string) => {
  const reference = referenceOf(link);
  return reference?._tag === "Entry"
    ? Effect.succeed(reference.ref)
    : Effect.fail(new ToolFailed({ message: `Not a link to a file or folder: ${link}` }));
};

const describe = (entry: Entry) =>
  entry.kind === "directory"
    ? `- ${linkTo(entry.name, entry.ref)}: folder`
    : `- ${linkTo(entry.name, entry.ref)}: ${entry.size} bytes, modified ${new Date(entry.modifiedAt).toISOString()}`;

const excerpt = (content: string, offset: number, limit: number, truncated: boolean) => {
  const lines = content.replace(/\n$/, "").split("\n");
  const shown = lines.slice(offset - 1, offset - 1 + Math.min(limit, LINE_LIMIT));
  const last = offset - 1 + shown.length;
  const notes = [
    ...(offset > 1 || last < lines.length ? [`Lines ${offset}–${last} of ${lines.length}.`] : []),
    ...(last < lines.length ? [`Call read_file with offset ${last + 1} to continue.`] : []),
    ...(truncated ? [`Only the first ${READ_LIMIT} bytes of the file can be read.`] : []),
  ];
  return notes.length === 0 ? shown.join("\n") : `${shown.join("\n")}\n\n[${notes.join(" ")}]`;
};

const tool = <A>(
  name: string,
  description: string,
  input: Schema.Codec<A, unknown>,
  use: (projectId: ProjectId, input: A) => Effect.Effect<AgentToolResult, { readonly message: string }>,
) => ({
  name,
  description,
  parameters: Schema.toJsonSchemaDocument(input).schema,
  call: (projectId: ProjectId, raw: unknown) =>
    Schema.decodeUnknownEffect(input)(raw).pipe(
      Effect.flatMap((decoded) => use(projectId, decoded)),
      Effect.catch((error) => Effect.succeed(text(error.message, true))),
    ),
});

const Line = Schema.Int.check(Schema.isGreaterThanOrEqualTo(1));

export class AgentTools extends Context.Service<
  AgentTools,
  { readonly forProject: (projectId: ProjectId) => AgentToolkit }
>()("@starlight/core/AgentTools") {
  static readonly layer = Layer.effect(AgentTools)(
    Effect.gen(function* () {
      const entries = yield* Entries;
      const files = yield* Files;

      const tools = [
        tool(
          "list_folder",
          "List the files and folders in one of the project's folders.",
          Schema.Struct({
            link: Schema.optionalKey(
              Schema.String.annotate({
                description:
                  "A starchive:entry link to a folder. Leave it out to list the project's folders.",
              }),
            ),
          }),
          (projectId, { link }) =>
            Effect.gen(function* () {
              const directory = link === undefined ? null : yield* entryOf(link);
              const listing = yield* entries.list(projectId, directory);
              const visible = listing.entries.filter((entry) => !entry.hidden);
              if (visible.length === 0) return text("The folder is empty.");
              const more = visible.length - LIST_LIMIT;
              const lines = visible.slice(0, LIST_LIMIT).map(describe);
              return text([...lines, ...(more > 0 ? [`…and ${more} more.`] : [])].join("\n"));
            }),
        ),
        tool(
          "read_file",
          `Read a text file or view an image (PNG, JPEG, GIF or WebP) in the project. Text comes back ${LINE_LIMIT} lines at a time.`,
          Schema.Struct({
            link: Schema.String.annotate({ description: "A starchive:entry link to a file." }),
            offset: Schema.optionalKey(
              Line.annotate({ description: "The line to start at, counting from 1." }),
            ),
            limit: Schema.optionalKey(
              Line.annotate({ description: `How many lines to read, ${LINE_LIMIT} at most.` }),
            ),
          }),
          (projectId, { link, offset = 1, limit = LINE_LIMIT }) =>
            Effect.gen(function* () {
              const { entry, content } = yield* files.read(projectId, yield* entryOf(link), READ_LIMIT);
              const mediaType = mediaTypeOf(entry.name);
              if (mediaType !== undefined && IMAGE_TYPES.has(mediaType)) {
                if (entry.size > IMAGE_LIMIT)
                  return text(`The image is too large to view (${entry.size} bytes).`, true);
                return {
                  content: [{ _tag: "Image", mediaType, data: Base64.encode(content) }],
                  failed: false,
                };
              }
              if (content.subarray(0, BINARY_PROBE).includes(0))
                return text("Starlight can't read this kind of file.", true);
              const decoded = yield* Stream.mkString(Stream.decodeText(Stream.succeed(content)));
              return text(excerpt(decoded, offset, limit, entry.size > content.length));
            }),
        ),
      ];

      const definitions = tools.map(({ name, description, parameters }) => ({
        name,
        description,
        parameters,
      }));

      return AgentTools.of({
        forProject: (projectId) => ({
          instructions: INSTRUCTIONS,
          tools: definitions,
          call: (name, input) =>
            tools.find((candidate) => candidate.name === name)?.call(projectId, input) ??
            Effect.succeed(text(`Unknown tool: ${name}`, true)),
        }),
      });
    }),
  );
}
