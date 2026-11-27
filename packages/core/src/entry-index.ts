import { type EntryId, type EntryRef, FileId, type SourceId } from "@starlight/contracts";
import { Array as Arr, Context, Effect, Layer, Option } from "effect";
import { type IgnoreMatcher, IgnoreRules } from "./ignore-rules.ts";
import type { LocatedDirectory } from "./projects.ts";
import {
  EntryStore,
  FactStore,
  type IdentifiedEntry,
  type SourceDriver,
  type SourceCrumb,
  type SourceEntry,
  type StoredEntry,
} from "./ports.ts";

const STAT_CONCURRENCY = 32;

export interface Synced {
  readonly missing: ReadonlyArray<EntryId>;
  readonly subdirectories: ReadonlyArray<EntryId>;
}

const unchanged = (stored: StoredEntry, entry: StoredEntry) =>
  stored.fileId === entry.fileId &&
  stored.key === entry.key &&
  stored.name === entry.name &&
  stored.kind === entry.kind &&
  stored.size === entry.size &&
  stored.createdAt === entry.createdAt &&
  stored.modifiedAt === entry.modifiedAt &&
  stored.hidden === entry.hidden &&
  stored.ignored === entry.ignored;

export class EntryIndex extends Context.Service<
  EntryIndex,
  {
    readonly bind: (
      located: LocatedDirectory,
      files: ReadonlyArray<SourceEntry>,
    ) => Effect.Effect<ReadonlyArray<IdentifiedEntry>>;
    readonly sync: (driver: SourceDriver, directory: EntryRef, deep: boolean) => Effect.Effect<Synced>;
    readonly forget: (source: SourceId, ids: ReadonlyArray<EntryId>) => Effect.Effect<void>;
    readonly roots: Effect.Effect<ReadonlyArray<EntryRef>>;
    readonly drop: (root: EntryRef, keep: ReadonlyArray<EntryId>) => Effect.Effect<void>;
  }
>()("@starlight/core/EntryIndex") {
  static readonly layer = Layer.effect(EntryIndex)(
    Effect.gen(function* () {
      const store = yield* EntryStore;
      const facts = yield* FactStore;
      const rules = yield* IgnoreRules;

      const childrenOf = (directory: EntryRef) =>
        Effect.map(
          store.children(directory.source, directory.id),
          (rows) => new Map<EntryId, StoredEntry>(rows.map((row) => [row.id, row])),
        );

      const isStillAt = (driver: SourceDriver, stored: StoredEntry) =>
        driver.stat(stored.id).pipe(
          Effect.map((entry) => entry.key === stored.key),
          Effect.orElseSucceed(() => false),
        );

      const identify = Effect.fnUntraced(function* (
        driver: SourceDriver,
        directory: EntryRef,
        files: ReadonlyArray<SourceEntry>,
        known: ReadonlyMap<EntryId, StoredEntry>,
        ignores: IgnoreMatcher,
      ) {
        const unknown = files.filter((file) => !known.get(file.id)?.fileId);
        const elsewhere = new Map(
          unknown.length === 0
            ? []
            : (yield* store.withKeys(
                directory.source,
                unknown.map((file) => file.key),
              )).map((row) => [row.key, row]),
        );
        const candidates = unknown.flatMap((file) => {
          const moved = elsewhere.get(file.key);
          elsewhere.delete(file.key);
          return moved ? [{ file: file.id, moved }] : [];
        });
        const relinks = new Map(
          (yield* Effect.filter(
            candidates,
            ({ moved }) => Effect.map(isStillAt(driver, moved), (stays) => !stays),
            { concurrency: STAT_CONCURRENCY },
          )).map(({ file, moved }) => [file, moved.fileId]),
        );
        return files.map((file): StoredEntry => ({
          ...file,
          fileId: known.get(file.id)?.fileId ?? relinks.get(file.id) ?? FileId.generate(),
          ignored: ignores(file.name),
        }));
      });

      const saveChanged = Effect.fnUntraced(function* (
        directory: EntryRef,
        entries: ReadonlyArray<StoredEntry>,
        known: ReadonlyMap<EntryId, StoredEntry>,
      ) {
        const changed = entries.filter((entry) => {
          const stored = known.get(entry.id);
          return !stored || !unchanged(stored, entry);
        });
        if (changed.length > 0) yield* store.save(directory.source, directory.id, changed);
        return changed.length > 0;
      });

      const forget = (source: SourceId, ids: ReadonlyArray<EntryId>, keep: ReadonlyArray<EntryId> = []) =>
        ids.length === 0 ? Effect.void : Effect.flatMap(store.remove(source, ids, keep), facts.remove);

      const anchor = (driver: SourceDriver, source: SourceId, trail: ReadonlyArray<SourceCrumb>) =>
        Effect.forEach(
          Arr.zip(trail, trail.slice(1)),
          ([parent, crumb]) =>
            driver.stat(crumb.id).pipe(
              Effect.flatMap((entry) =>
                store.save(source, parent.id, [{ ...entry, fileId: null, ignored: true }]),
              ),
              Effect.ignore,
            ),
          { discard: true },
        );

      const drop = (root: EntryRef, keep: ReadonlyArray<EntryId>) =>
        Effect.flatMap(store.children(root.source, root.id), (rows) =>
          forget(
            root.source,
            rows.map((row) => row.id),
            keep,
          ),
        );

      return EntryIndex.of({
        bind: Effect.fn("EntryIndex.bind")(function* ({ mount, driver, directory }, files) {
          const ignores = yield* rules.matcher;
          const trail = driver.trail(mount.root.id, directory.id);
          const ignoredAt = trail.findIndex(({ name }) => ignores(name));
          const buried = ignoredAt >= 0;
          if (buried) yield* anchor(driver, directory.source, trail.slice(ignoredAt));
          const known = yield* childrenOf(directory);
          const changed = yield* saveChanged(
            directory,
            yield* identify(driver, directory, files, known, (name) => buried || ignores(name)),
            known,
          );
          const settled = changed ? yield* childrenOf(directory) : known;
          return files.flatMap((file): ReadonlyArray<IdentifiedEntry> => {
            const fileId = settled.get(file.id)?.fileId;
            return fileId ? [{ ...file, fileId }] : [];
          });
        }),
        sync: Effect.fn("EntryIndex.sync")(function* (driver, directory, deep) {
          const listed = yield* Effect.option(driver.list(directory.id));
          if (Option.isNone(listed)) return { missing: [], subdirectories: [] };
          const kinds = new Map(listed.value.map((entry) => [entry.id, entry.kind]));
          const stored = yield* childrenOf(directory);
          const replaced = [...stored.values()].filter((row) => (kinds.get(row.id) ?? row.kind) !== row.kind);
          yield* forget(
            directory.source,
            replaced.map((row) => row.id),
          );
          const known = replaced.length === 0 ? stored : yield* childrenOf(directory);
          const ignores = yield* rules.matcher;
          const files = listed.value.filter((entry) => entry.kind === "file");
          const others = listed.value
            .filter((entry) => entry.kind !== "file")
            .map((entry): StoredEntry => ({ ...entry, fileId: null, ignored: ignores(entry.name) }));
          yield* saveChanged(
            directory,
            [...(yield* identify(driver, directory, files, known, ignores)), ...others],
            known,
          );
          const directories = others.filter((entry) => entry.kind === "directory");
          yield* Effect.forEach(
            directories.filter((entry) => entry.ignored),
            (entry) => drop({ source: directory.source, id: entry.id }, []),
            { discard: true },
          );
          return {
            missing: [...known.keys()].filter((id) => !kinds.has(id)),
            subdirectories: directories
              .filter((entry) => !entry.ignored && (deep || !known.has(entry.id)))
              .map((entry) => entry.id),
          };
        }),
        forget,
        roots: store.roots,
        drop,
      });
    }),
  );
}
