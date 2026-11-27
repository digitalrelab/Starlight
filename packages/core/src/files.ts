import {
  type EntryRef,
  type FileDetails,
  type FileError,
  type FileSource,
  mediaTypeOf,
  FileVersion,
  type ProjectId,
  VersionConflict,
  type WriteError,
} from "@starlight/contracts";
import { Context, Effect, Layer, Option } from "effect";
import { FileIdentities } from "./file-identities.ts";
import { Catalog } from "./catalog.ts";
import { AuditLog, CurrentActor, FileTokens, type SourceEntry } from "./ports.ts";
import { Projects } from "./projects.ts";

const versionOf = ({ modifiedAt, size }: SourceEntry) => FileVersion.make(`${modifiedAt}:${size}`);

export class Files extends Context.Service<
  Files,
  {
    readonly source: (projectId: ProjectId, file: EntryRef) => Effect.Effect<FileSource, FileError>;
    readonly details: (projectId: ProjectId, file: EntryRef) => Effect.Effect<FileDetails, FileError>;
    readonly write: (
      projectId: ProjectId,
      file: EntryRef,
      content: Uint8Array,
      base: FileVersion,
    ) => Effect.Effect<FileVersion, WriteError, CurrentActor>;
  }
>()("@starlight/core/Files") {
  static readonly layer = Layer.effect(Files)(
    Effect.gen(function* () {
      const projects = yield* Projects;
      const tokens = yield* FileTokens;
      const catalog = yield* Catalog;
      const identities = yield* FileIdentities;
      const audit = yield* AuditLog;

      const identify = Effect.fnUntraced(function* (projectId: ProjectId, requested: EntryRef) {
        const { driver, file, entry } = yield* projects.locateFile(projectId, requested);
        const folder = { source: file.source, id: driver.parent(file.id) };
        const [identified] = yield* identities.bind(driver, folder, [entry]);
        if (!identified) return yield* Effect.die(new Error(`No identity bound for ${file.id}`));
        return { driver, file, folder, entry: identified };
      });

      return Files.of({
        source: Effect.fn("Files.source")(function* (projectId, requested) {
          const { driver, file, entry } = yield* identify(projectId, requested);
          const dimensions = yield* catalog.entry("dimensions", driver, entry);
          return {
            token: tokens.issue(file, entry.modifiedAt),
            version: versionOf(entry),
            dimensions: Option.getOrNull(dimensions),
          };
        }),
        details: Effect.fn("Files.details")(function* (projectId, requested) {
          const { driver, folder, entry } = yield* identify(projectId, requested);
          const [parent, dimensions, palette, traits] = yield* Effect.all([
            driver.stat(folder.id),
            catalog.entry("dimensions", driver, entry),
            catalog.processedEntry("palette", entry),
            catalog.processedEntry("traits", entry),
          ]);
          return {
            fileId: entry.fileId,
            folderName: parent.name,
            size: entry.size,
            createdAt: entry.createdAt,
            modifiedAt: entry.modifiedAt,
            mediaType: mediaTypeOf(entry.name) ?? null,
            dimensions: Option.getOrNull(dimensions),
            palette: Option.getOrElse(palette, () => []),
            properties: Option.getOrElse(traits, () => []),
          };
        }),
        write: Effect.fn("Files.write")(function* (projectId, requested, content, base) {
          const { driver, file, entry } = yield* projects.locateFile(projectId, requested);
          if (versionOf(entry) !== base) return yield* new VersionConflict({ entry: requested });
          const written = yield* driver.write(file.id, content);
          yield* audit.record({
            actor: yield* CurrentActor,
            action: "WriteFile",
            target: JSON.stringify(file),
          });
          return versionOf(written);
        }),
      });
    }),
  );
}
