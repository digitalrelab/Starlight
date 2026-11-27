import type { EntryId, EntryRef, Project } from "@starlight/contracts";
import { Array as Arr, type Duration, Effect, FiberMap, Layer, Stream } from "effect";
import { EntryIndex } from "./entry-index.ts";
import type { SourceChange, SourceDriver } from "./ports.ts";
import { Projects } from "./projects.ts";

const SYNC_CONCURRENCY = 8;
const CHANGE_BATCH = 256;
const CHANGE_WINDOW: Duration.Input = "250 millis";

interface Root {
  readonly ref: EntryRef;
  readonly driver: SourceDriver;
}

const keyOf = ({ source, id }: EntryRef) => JSON.stringify([source, id]);

const covers = (outer: Root, inner: Root) =>
  outer.ref.source === inner.ref.source && outer.driver.contains(outer.ref.id, inner.ref.id);

const changedDirectories = (root: Root, changes: ReadonlyArray<SourceChange>) => [
  ...new Set(
    changes.flatMap((change) =>
      change._tag === "Changed"
        ? change.directories.filter((id) => root.driver.contains(root.ref.id, id))
        : [],
    ),
  ),
];

export const IndexerLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const projects = yield* Projects;
    const index = yield* EntryIndex;
    const fibers = yield* FiberMap.make<string>();

    const reconcile = Effect.fnUntraced(function* (
      root: Root,
      directories: ReadonlyArray<EntryId>,
      deep: boolean,
    ) {
      const missing: Array<EntryId> = [];
      let frontier = directories;
      while (frontier.length > 0) {
        const synced = yield* Effect.forEach(
          frontier,
          (id) => index.sync(root.driver, { source: root.ref.source, id }, deep),
          { concurrency: SYNC_CONCURRENCY },
        );
        missing.push(...synced.flatMap((result) => result.missing));
        frontier = synced.flatMap((result) => result.subdirectories);
      }
      yield* index.forget(root.ref.source, missing);
    });

    const follow = (root: Root) =>
      root.driver.watch(root.ref.id).pipe(
        Stream.groupedWithin(CHANGE_BATCH, CHANGE_WINDOW),
        Stream.runForEach((changes) =>
          changes.some((change) => change._tag === "Resync")
            ? reconcile(root, [root.ref.id], true)
            : reconcile(root, changedDirectories(root, changes), false),
        ),
        Effect.catchCause((cause) => Effect.logWarning("Indexing stopped", root.ref, cause)),
      );

    const resolve = (refs: Iterable<EntryRef>) =>
      Effect.map(
        Effect.forEach(refs, (ref) =>
          Effect.option(Effect.map(projects.driverFor(ref.source), (driver): Root => ({ ref, driver }))),
        ),
        (resolved) => new Map(Arr.getSomes(resolved).map((root) => [keyOf(root.ref), root])),
      );

    const rootsOf = Effect.fnUntraced(function* (all: ReadonlyArray<Project>) {
      const roots = [
        ...(yield* resolve(all.flatMap(({ mounts }) => mounts.map(({ root }) => root)))).values(),
      ];
      return new Map(
        roots
          .filter((root) => !roots.some((other) => other !== root && covers(other, root)))
          .map((root) => [keyOf(root.ref), root]),
      );
    });

    const apply = Effect.fnUntraced(function* (
      current: ReadonlyMap<string, Root>,
      next: ReadonlyMap<string, Root>,
    ) {
      for (const [key, root] of current) {
        if (next.has(key)) continue;
        yield* FiberMap.remove(fibers, key);
        if (![...next.values()].some((other) => covers(other, root))) yield* index.drop(root.ref);
      }
      for (const [key, root] of next) {
        yield* FiberMap.run(fibers, key, { onlyIfMissing: true })(follow(root));
      }
      return next;
    });

    const indexed = yield* resolve(yield* index.roots);

    yield* projects.watchAll.pipe(
      Stream.mapEffect(rootsOf),
      Stream.runFoldEffect(() => indexed, apply),
      Effect.forkScoped,
    );
  }),
);
