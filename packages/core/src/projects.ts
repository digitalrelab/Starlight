import {
  type DirectoryError,
  DirectoryMissing,
  type EntryRef,
  type FileError,
  type Mount,
  type MountError,
  NotADirectory,
  NotAFile,
  OutsideProject,
  type Project,
  type ProjectId,
  ProjectNotFound,
  type SourceId,
  SourceUnavailable,
} from "@starlight/contracts";
import { Context, Effect, Layer, Option, PubSub, Stream } from "effect";
import {
  AuditLog,
  CurrentActor,
  ProjectStore,
  type SourceDriver,
  SourceDrivers,
  type SourceEntry,
} from "./ports.ts";

const mountOf = (project: Project, driver: SourceDriver, ref: EntryRef) =>
  project.mounts.find((mount) => mount.root.source === ref.source && driver.contains(mount.root.id, ref.id));

export const ownerOf = (projects: ReadonlyArray<Project>, driver: SourceDriver, ref: EntryRef) => {
  for (const project of projects) {
    const mount = mountOf(project, driver, ref);
    if (mount) return { project, mount };
  }
  return undefined;
};

export interface LocatedDirectory {
  readonly mount: Mount;
  readonly driver: SourceDriver;
  readonly directory: EntryRef;
}

export interface LocatedFile {
  readonly mount: Mount;
  readonly driver: SourceDriver;
  readonly file: EntryRef;
  readonly entry: SourceEntry;
}

export class Projects extends Context.Service<
  Projects,
  {
    readonly create: (root: EntryRef) => Effect.Effect<Project, MountError, CurrentActor>;
    readonly list: Effect.Effect<ReadonlyArray<Project>>;
    readonly rename: (id: ProjectId, name: string) => Effect.Effect<Project, ProjectNotFound, CurrentActor>;
    readonly remove: (id: ProjectId) => Effect.Effect<void, ProjectNotFound, CurrentActor>;
    readonly addMount: (
      id: ProjectId,
      root: EntryRef,
    ) => Effect.Effect<Project, ProjectNotFound | MountError, CurrentActor>;
    readonly removeMount: (
      id: ProjectId,
      root: EntryRef,
    ) => Effect.Effect<Project, ProjectNotFound, CurrentActor>;
    readonly get: (id: ProjectId) => Effect.Effect<Project, ProjectNotFound>;
    readonly watch: (id: ProjectId) => Stream.Stream<Project, ProjectNotFound>;
    readonly watchAll: Stream.Stream<ReadonlyArray<Project>>;
    readonly driverFor: (source: SourceId) => Effect.Effect<SourceDriver, SourceUnavailable>;
    readonly locateDirectory: (
      id: ProjectId,
      directory: EntryRef,
    ) => Effect.Effect<LocatedDirectory, DirectoryError>;
    readonly locateFile: (id: ProjectId, file: EntryRef) => Effect.Effect<LocatedFile, FileError>;
  }
>()("@starlight/core/Projects") {
  static readonly layer = Layer.effect(Projects)(
    Effect.gen(function* () {
      const drivers = yield* SourceDrivers;
      const store = yield* ProjectStore;
      const audit = yield* AuditLog;
      const changes = yield* PubSub.unbounded<ProjectId>();

      const get = (id: ProjectId) =>
        store.findById(id).pipe(
          Effect.flatMap(
            Option.match({
              onNone: () => Effect.fail(new ProjectNotFound({ projectId: id })),
              onSome: Effect.succeed,
            }),
          ),
        );

      const driverFor = (source: SourceId) => {
        const found = drivers.get(source);
        return found ? Effect.succeed(found) : Effect.fail(new SourceUnavailable({ source }));
      };

      const prepareMount = Effect.fn("Projects.prepareMount")(function* (root: EntryRef) {
        const driver = yield* driverFor(root.source);
        const id = yield* driver.canonicalize(root.id);
        const entry = yield* driver.stat(id);
        if (entry.kind !== "directory") return yield* new NotADirectory({ entry: root });
        return { root: { source: root.source, id }, name: entry.name } satisfies Mount;
      });

      const recordChange = Effect.fn("Projects.recordChange")(function* (
        projectId: ProjectId,
        action: string,
        details?: object,
      ) {
        const target = JSON.stringify({ projectId, ...details });
        yield* audit.record({ actor: yield* CurrentActor, action, target });
        yield* PubSub.publish(changes, projectId);
      });

      const observe = <A, E>(load: Effect.Effect<A, E>, concerns: (changed: ProjectId) => boolean) =>
        Stream.unwrap(
          Effect.map(PubSub.subscribe(changes), (subscription) =>
            Stream.concat(
              Stream.fromEffect(load),
              Stream.fromSubscription(subscription).pipe(
                Stream.filter(concerns),
                Stream.mapEffect(() => load),
              ),
            ),
          ),
        );

      const statIfExists = (driver: SourceDriver, ref: EntryRef) =>
        driver.stat(ref.id).pipe(
          Effect.map(Option.some),
          Effect.catchTag("SourceError", (error) =>
            error.reason === "NotFound" ? Effect.succeedNone : Effect.fail(error),
          ),
        );

      const isDirectory = (driver: SourceDriver, ref: EntryRef) =>
        driver.stat(ref.id).pipe(
          Effect.map((entry) => entry.kind === "directory"),
          Effect.orElseSucceed(() => false),
        );

      const missing = Effect.fn("Projects.missing")(function* (
        mount: Mount,
        driver: SourceDriver,
        requested: EntryRef,
      ) {
        const ancestors = [
          mount.root,
          ...driver
            .trail(mount.root.id, requested.id)
            .map(({ id }) => ({ source: requested.source, id }))
            .slice(0, -1),
        ].reverse();
        const nearest = yield* Effect.findFirst(ancestors, (ref) => isDirectory(driver, ref));
        return yield* new DirectoryMissing({ entry: requested, nearest: Option.getOrNull(nearest) });
      });

      return Projects.of({
        create: Effect.fn("Projects.create")(function* (root) {
          const mount = yield* prepareMount(root);
          const project = yield* store.create({ name: mount.name, mounts: [mount] });
          yield* recordChange(project.id, "CreateProject", { root: mount.root });
          return project;
        }),
        list: store.list,
        rename: Effect.fn("Projects.rename")(function* (id, name) {
          const project = yield* get(id);
          yield* store.rename(id, name);
          yield* recordChange(id, "RenameProject");
          return { ...project, name };
        }),
        remove: Effect.fn("Projects.remove")(function* (id) {
          yield* get(id);
          yield* store.remove(id);
          yield* recordChange(id, "DeleteProject");
        }),
        addMount: Effect.fn("Projects.addMount")(function* (id, root) {
          yield* get(id);
          const mount = yield* prepareMount(root);
          yield* store.addMount(id, mount);
          yield* recordChange(id, "AddMount", { root: mount.root });
          return yield* get(id);
        }),
        removeMount: Effect.fn("Projects.removeMount")(function* (id, root) {
          yield* get(id);
          yield* store.removeMount(id, root);
          yield* recordChange(id, "RemoveMount", { root });
          return yield* get(id);
        }),
        get,
        watch: (id) => observe(get(id), (changed) => changed === id),
        watchAll: observe(store.list, () => true),
        driverFor,
        locateDirectory: Effect.fn("Projects.locateDirectory")(function* (id, requested) {
          const project = yield* get(id);
          const driver = yield* driverFor(requested.source);
          const lexicalMount = mountOf(project, driver, requested);
          if (!lexicalMount) return yield* new OutsideProject({ entry: requested });
          const entry = yield* statIfExists(driver, requested);
          if (Option.isNone(entry) || entry.value.kind !== "directory")
            return yield* missing(lexicalMount, driver, requested);
          const directory = { source: requested.source, id: yield* driver.canonicalize(requested.id) };
          const mount = mountOf(project, driver, directory);
          if (!mount) return yield* new OutsideProject({ entry: requested });
          return { mount, driver, directory };
        }),
        locateFile: Effect.fn("Projects.locateFile")(function* (id, requested) {
          const project = yield* get(id);
          const driver = yield* driverFor(requested.source);
          if (!mountOf(project, driver, requested)) return yield* new OutsideProject({ entry: requested });
          const file = { source: requested.source, id: yield* driver.canonicalize(requested.id) };
          const mount = mountOf(project, driver, file);
          if (!mount) return yield* new OutsideProject({ entry: requested });
          const entry = yield* driver.stat(file.id);
          if (entry.kind !== "file") return yield* new NotAFile({ entry: requested });
          return { mount, driver, file, entry };
        }),
      });
    }),
  );
}
