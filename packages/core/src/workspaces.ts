import {
  type DirectoryError,
  DirectoryMissing,
  type EntryRef,
  type Mount,
  type MountError,
  NotADirectory,
  OutsideWorkspace,
  type SourceId,
  SourceUnavailable,
  type Workspace,
  type WorkspaceId,
  WorkspaceNotFound,
} from "@starlight/contracts";
import { Context, Effect, Layer, Option } from "effect";
import { AuditLog, CurrentActor, type SourceDriver, SourceDrivers, WorkspaceStore } from "./ports.ts";

const RECENT_LIMIT = 20;

export interface LocatedDirectory {
  readonly mount: Mount;
  readonly driver: SourceDriver;
  readonly directory: EntryRef;
}

export class Workspaces extends Context.Service<
  Workspaces,
  {
    readonly open: (root: EntryRef) => Effect.Effect<Workspace, MountError, CurrentActor>;
    readonly addMount: (
      id: WorkspaceId,
      root: EntryRef,
    ) => Effect.Effect<Workspace, WorkspaceNotFound | MountError, CurrentActor>;
    readonly recent: Effect.Effect<ReadonlyArray<Workspace>>;
    readonly get: (id: WorkspaceId) => Effect.Effect<Workspace, WorkspaceNotFound>;
    readonly driverFor: (source: SourceId) => Effect.Effect<SourceDriver, SourceUnavailable>;
    readonly locateDirectory: (
      id: WorkspaceId,
      directory: EntryRef,
    ) => Effect.Effect<LocatedDirectory, DirectoryError>;
  }
>()("@starlight/core/Workspaces") {
  static readonly layer = Layer.effect(Workspaces)(
    Effect.gen(function* () {
      const drivers = yield* SourceDrivers;
      const store = yield* WorkspaceStore;
      const audit = yield* AuditLog;

      const get = (id: WorkspaceId) =>
        store.findById(id).pipe(
          Effect.flatMap(
            Option.match({
              onNone: () => Effect.fail(new WorkspaceNotFound({ workspaceId: id })),
              onSome: Effect.succeed,
            }),
          ),
        );

      const driverFor = (source: SourceId) => {
        const found = drivers.get(source);
        return found ? Effect.succeed(found) : Effect.fail(new SourceUnavailable({ source }));
      };

      const prepareMount = Effect.fn("Workspaces.prepareMount")(function* (root: EntryRef) {
        const driver = yield* driverFor(root.source);
        const id = yield* driver.canonicalize(root.id);
        const entry = yield* driver.stat(id);
        if (entry.kind !== "directory") return yield* new NotADirectory({ entry: root });
        return { root: { source: root.source, id }, name: entry.name } satisfies Mount;
      });

      const record = Effect.fn("Workspaces.record")(function* (action: string, root: EntryRef) {
        yield* audit.record({ actor: yield* CurrentActor, action, target: JSON.stringify(root) });
      });

      const mountOf = (workspace: Workspace, driver: SourceDriver, directory: EntryRef) =>
        workspace.mounts.find(
          (mount) => mount.root.source === directory.source && driver.contains(mount.root.id, directory.id),
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

      const missing = Effect.fn("Workspaces.missing")(function* (
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

      return Workspaces.of({
        open: Effect.fn("Workspaces.open")(function* (root) {
          const mount = yield* prepareMount(root);
          const existing = yield* store.findBySoleMount(mount.root);
          const workspace = yield* Option.match(existing, {
            onNone: () => store.create({ name: mount.name, mounts: [mount] }),
            onSome: (found) => store.touch(found.id),
          });
          yield* record("OpenWorkspace", mount.root);
          return workspace;
        }),
        addMount: Effect.fn("Workspaces.addMount")(function* (id, root) {
          const workspace = yield* get(id);
          const mount = yield* prepareMount(root);
          yield* store.addMount(workspace.id, mount);
          yield* record("AddMount", mount.root);
          return yield* get(id);
        }),
        recent: store.recent(RECENT_LIMIT),
        get,
        driverFor,
        locateDirectory: Effect.fn("Workspaces.locateDirectory")(function* (id, requested) {
          const workspace = yield* get(id);
          const driver = yield* driverFor(requested.source);
          const lexicalMount = mountOf(workspace, driver, requested);
          if (!lexicalMount) return yield* new OutsideWorkspace({ entry: requested });
          const entry = yield* statIfExists(driver, requested);
          if (Option.isNone(entry) || entry.value.kind !== "directory")
            return yield* missing(lexicalMount, driver, requested);
          const directory = { source: requested.source, id: yield* driver.canonicalize(requested.id) };
          const mount = mountOf(workspace, driver, directory);
          if (!mount) return yield* new OutsideWorkspace({ entry: requested });
          return { mount, driver, directory };
        }),
      });
    }),
  );
}
