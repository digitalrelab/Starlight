import { type EntryId, type EntryRef, FileId } from "@starlight/contracts";
import { Context, Effect, Layer } from "effect";
import {
  type AssetEntry,
  AssetStore,
  type SourceDriver,
  type SourceEntry,
  type StoredAsset,
} from "./ports.ts";

export class Assets extends Context.Service<
  Assets,
  {
    readonly bind: (
      driver: SourceDriver,
      directory: EntryRef,
      entries: ReadonlyArray<SourceEntry>,
    ) => Effect.Effect<ReadonlyArray<AssetEntry>>;
  }
>()("@starlight/core/Assets") {
  static readonly layer = Layer.effect(Assets)(
    Effect.gen(function* () {
      const store = yield* AssetStore;

      const isStillAt = (driver: SourceDriver, asset: StoredAsset) =>
        driver.stat(asset.entry).pipe(
          Effect.map((entry) => entry.key === asset.key),
          Effect.orElseSucceed(() => false),
        );

      const recorded = (directory: EntryRef) =>
        Effect.map(
          store.inDirectory(directory.source, directory.id),
          (assets) => new Map<EntryId, StoredAsset>(assets.map((asset) => [asset.entry, asset])),
        );

      return Assets.of({
        bind: Effect.fn("Assets.bind")(function* (driver, directory, entries) {
          const known = yield* recorded(directory);
          const unknown = entries.filter((entry) => !known.has(entry.id));
          const elsewhere = new Map(
            unknown.length === 0
              ? []
              : (yield* store.withKeys(
                  directory.source,
                  unknown.map((entry) => entry.key),
                )).map((asset) => [asset.key, asset]),
          );
          const changed: Array<StoredAsset> = [];
          for (const entry of entries) {
            const found = known.get(entry.id);
            if (found) {
              if (found.key !== entry.key) changed.push({ ...found, key: entry.key });
              continue;
            }
            const moved = elsewhere.get(entry.key);
            elsewhere.delete(entry.key);
            const id = moved && !(yield* isStillAt(driver, moved)) ? moved.id : FileId.generate();
            changed.push({ id, entry: entry.id, key: entry.key });
          }
          if (changed.length > 0) yield* store.save(directory.source, directory.id, changed);
          const settled = changed.length === 0 ? known : yield* recorded(directory);
          return entries.flatMap((entry): ReadonlyArray<AssetEntry> => {
            const asset = settled.get(entry.id);
            return asset ? [{ ...entry, asset: asset.id }] : [];
          });
        }),
      });
    }),
  );
}
