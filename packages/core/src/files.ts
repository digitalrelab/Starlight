import {
  type EntryRef,
  type FileError,
  type FileSource,
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

      return Files.of({
        source: Effect.fn("Files.source")(function* (projectId, requested) {
          const { driver, file, entry } = yield* projects.locateFile(projectId, requested);
          const [bound] = yield* identities.bind(
            driver,
            { source: file.source, id: driver.parent(file.id) },
            [entry],
          );
          const dimensions = bound ? yield* catalog.entry("dimensions", driver, bound) : Option.none();
          return {
            token: tokens.issue(file, entry.modifiedAt),
            version: versionOf(entry),
            dimensions: Option.getOrNull(dimensions),
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
