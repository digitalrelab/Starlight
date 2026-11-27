import type {
  DirectoryError,
  Entry,
  EntryChange,
  EntryRef,
  Listing,
  Mount,
  ProjectId,
  ProjectNotFound,
  SourceError,
  SourceId,
  SourceUnavailable,
} from "@starlight/contracts";
import { Array as Arr, Context, Effect, Layer, Result, Stream } from "effect";
import type { SourceChange, SourceDriver, SourceEntry } from "./ports.ts";
import { Projects } from "./projects.ts";

const MAX_CHANGED_DIRECTORIES = 1024;

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

const byKindThenName = (a: Entry, b: Entry) => {
  const aDir = a.kind === "directory" ? 0 : 1;
  const bDir = b.kind === "directory" ? 0 : 1;
  return aDir - bDir || collator.compare(a.name, b.name);
};

const toEntry = (source: SourceId, { id, ...entry }: SourceEntry): Entry => ({
  ...entry,
  ref: { source, id },
});

const resync: EntryChange = { _tag: "Resync" };

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
    readonly watch: (
      projectId: ProjectId,
    ) => Stream.Stream<EntryChange, ProjectNotFound | SourceUnavailable | SourceError>;
  }
>()("@starlight/core/Entries") {
  static readonly layer = Layer.effect(Entries)(
    Effect.gen(function* () {
      const projects = yield* Projects;

      const listMounts = Effect.fn("Entries.listMounts")(function* (projectId: ProjectId) {
        const { mounts } = yield* projects.get(projectId);
        const entries = yield* Effect.forEach(mounts, (mount) =>
          projects.driverFor(mount.root.source).pipe(
            Effect.flatMap((driver) => driver.stat(mount.root.id)),
            Effect.map((entry) => toEntry(mount.root.source, { ...entry, name: mount.name })),
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
          const below = driver
            .trail(mount.root.id, directory.id)
            .map(({ id, name }) => ({ ref: { source: directory.source, id }, name }));
          return {
            trail: [{ ref: mount.root, name: mount.name }, ...below],
            entries: children.map((child) => toEntry(directory.source, child)).sort(byKindThenName),
          };
        }),

        watch: (projectId) =>
          projects.get(projectId).pipe(
            Effect.flatMap(({ mounts }) =>
              Effect.forEach(mounts, (mount) =>
                projects
                  .driverFor(mount.root.source)
                  .pipe(
                    Effect.map((driver) =>
                      driver.watch(mount.root.id).pipe(Stream.filterMap(toChange(mount, driver))),
                    ),
                  ),
              ),
            ),
            Effect.map((streams) => Stream.mergeAll(streams, { concurrency: "unbounded" })),
            Stream.unwrap,
          ),
      });
    }),
  );
}
