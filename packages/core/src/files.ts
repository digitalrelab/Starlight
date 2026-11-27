import {
  type EntryRef,
  type FileError,
  type FileSource,
  FileVersion,
  VersionConflict,
  type WorkspaceId,
  type WriteError,
} from "@starlight/contracts";
import { Context, Effect, Layer, Option } from "effect";
import { Catalog } from "./catalog.ts";
import { AuditLog, CurrentActor, FileTokens, type SourceEntry } from "./ports.ts";
import { Workspaces } from "./workspaces.ts";

const versionOf = ({ modifiedAt, size }: SourceEntry) => FileVersion.make(`${modifiedAt}:${size}`);

export class Files extends Context.Service<
  Files,
  {
    readonly source: (workspaceId: WorkspaceId, file: EntryRef) => Effect.Effect<FileSource, FileError>;
    readonly write: (
      workspaceId: WorkspaceId,
      file: EntryRef,
      content: Uint8Array,
      base: FileVersion,
    ) => Effect.Effect<FileVersion, WriteError, CurrentActor>;
  }
>()("@starlight/core/Files") {
  static readonly layer = Layer.effect(Files)(
    Effect.gen(function* () {
      const workspaces = yield* Workspaces;
      const tokens = yield* FileTokens;
      const catalog = yield* Catalog;
      const audit = yield* AuditLog;

      return Files.of({
        source: Effect.fn("Files.source")(function* (workspaceId, requested) {
          const { driver, file, entry } = yield* workspaces.locateFile(workspaceId, requested);
          const dimensions = yield* catalog.entry("dimensions", driver, file, entry);
          return {
            token: tokens.issue(file, entry.modifiedAt),
            version: versionOf(entry),
            dimensions: Option.getOrNull(dimensions),
          };
        }),
        write: Effect.fn("Files.write")(function* (workspaceId, requested, content, base) {
          const { driver, file, entry } = yield* workspaces.locateFile(workspaceId, requested);
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
