import {
  type CreatableKind,
  type CreateError,
  type DirectoryError,
  type Entry,
  type EntryChange,
  EntryExists,
  type EntryRef,
  type FileId,
  InvalidName,
  type Listing,
  type Mount,
  type ProjectId,
  type ProjectNotFound,
  type SourceError,
  type SourceId,
  type SourceUnavailable,
} from "@starlight/contracts";
import { Array as Arr, Context, Effect, Layer, Result, Stream } from "effect";
import { FileIdentities } from "./file-identities.ts";
import { AuditLog, CurrentActor, type SourceChange, type SourceDriver, type SourceEntry } from "./ports.ts";
import { Projects } from "./projects.ts";

const MAX_CHANGED_DIRECTORIES = 1024;

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

const byKindThenName = (a: Entry, b: Entry) => {
  const aDir = a.kind === "directory" ? 0 : 1;
  const bDir = b.kind === "directory" ? 0 : 1;
  return aDir - bDir || collator.compare(a.name, b.name);
};

const toEntry = (
  source: SourceId,
  { id, key: _key, createdAt: _createdAt, ...entry }: SourceEntry,
  fileId: FileId | null,
): Entry => ({
  ...entry,
  ref: { source, id },
  fileId,
});

const isValidName = (name: string) =>
  name.trim() !== "" && name !== "." && name !== ".." && !/[/\\\0]/.test(name);

const resync: EntryChange = { _tag: "Resync" };

const sameMounts = (a: ReadonlyArray<Mount>, b: ReadonlyArray<Mount>) =>
  a.length === b.length &&
  a.every(
    (mount, index) => mount.root.source === b[index]?.root.source && mount.root.id === b[index]?.root.id,
  );

const toChange =
  (mount: Mount, driver: SourceDriver) =>
  (change: SourceChange): Result.Result<EntryChange, void> => {
    if (change._tag === "Resync" || change.directories.length > MAX_CHANGED_DIRECTORIES)
      return Result.succeed(resync);
    if (change.directories.length === 0) return Result.failVoid;
    if (!change.directories.every((id) => driver.contains(mount.root.id, id))) return Result.succeed(resync);
    return Result.succeed({
      _tag: "Changed",
      directories: change.directories.map((id) => ({ source: mount.root.source, id })),
    });
  };

export class Entries extends Context.Service<
  Entries,
  {
    readonly list: (
      projectId: ProjectId,
      directory: EntryRef | null,
    ) => Effect.Effect<Listing, DirectoryError>;
    readonly create: (
      projectId: ProjectId,
      directory: EntryRef,
      name: string,
      kind: CreatableKind,
    ) => Effect.Effect<EntryRef, CreateError, CurrentActor>;
    readonly watch: (
      projectId: ProjectId,
    ) => Stream.Stream<EntryChange, ProjectNotFound | SourceUnavailable | SourceError>;
  }
>()("@starlight/core/Entries") {
  static readonly layer = Layer.effect(Entries)(
    Effect.gen(function* () {
      const projects = yield* Projects;
      const identities = yield* FileIdentities;
      const audit = yield* AuditLog;

      const listMounts = Effect.fn("Entries.listMounts")(function* (projectId: ProjectId) {
        const { mounts } = yield* projects.get(projectId);
        const entries = yield* Effect.forEach(mounts, (mount) =>
          projects.driverFor(mount.root.source).pipe(
            Effect.flatMap((driver) => driver.stat(mount.root.id)),
            Effect.map((entry) => toEntry(mount.root.source, { ...entry, name: mount.name }, null)),
            Effect.option,
          ),
        );
        return { trail: [], entries: Arr.getSomes(entries) };
      });

      return Entries.of({
        list: Effect.fn("Entries.list")(function* (projectId, requested) {
          if (!requested) return yield* listMounts(projectId);
          const { mount, driver, directory } = yield* projects.locateDirectory(projectId, requested);
          const children = yield* driver.list(directory.id);
          const files = yield* identities.bind(
            driver,
            directory,
            children.filter((child) => child.kind === "file"),
          );
          const fileIds = new Map(files.map((file) => [file.id, file.fileId]));
          const below = driver
            .trail(mount.root.id, directory.id)
            .map(({ id, name }) => ({ ref: { source: directory.source, id }, name }));
          return {
            trail: [{ ref: mount.root, name: mount.name }, ...below],
            entries: children
              .map((child) => toEntry(directory.source, child, fileIds.get(child.id) ?? null))
              .sort(byKindThenName),
          };
        }),

        create: Effect.fn("Entries.create")(function* (projectId, requested, name, kind) {
          if (!isValidName(name)) return yield* new InvalidName({ name });
          const { driver, directory } = yield* projects.locateDirectory(projectId, requested);
          const created = yield* driver
            .create(directory.id, name, kind)
            .pipe(
              Effect.mapError((error) =>
                error.reason === "AlreadyExists" ? new EntryExists({ entry: error.entry }) : error,
              ),
            );
          const ref = { source: directory.source, id: created.id };
          yield* audit.record({
            actor: yield* CurrentActor,
            action: kind === "file" ? "CreateFile" : "CreateDirectory",
            target: JSON.stringify(ref),
          });
          return ref;
        }),

        watch: (projectId) =>
          projects.watch(projectId).pipe(
            Stream.map(({ mounts }) => mounts),
            Stream.changesWith(sameMounts),
            Stream.switchMap((mounts) =>
              Effect.forEach(mounts, (mount) =>
                projects
                  .driverFor(mount.root.source)
                  .pipe(
                    Effect.map((driver) =>
                      driver.watch(mount.root.id).pipe(Stream.filterMap(toChange(mount, driver))),
                    ),
                  ),
              ).pipe(
                Effect.map((streams) => Stream.mergeAll(streams, { concurrency: "unbounded" })),
                Stream.unwrap,
              ),
            ),
          ),
      });
    }),
  );
}
