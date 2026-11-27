import { type EntryId, type EntryRef, FileId } from "@starlight/contracts";
import { Context, Effect, Layer } from "effect";
import {
  type IdentifiedEntry,
  FileIdentityStore,
  type SourceDriver,
  type SourceEntry,
  type FileIdentity,
} from "./ports.ts";

const STAT_CONCURRENCY = 32;

export class FileIdentities extends Context.Service<
  FileIdentities,
  {
    readonly bind: (
      driver: SourceDriver,
      directory: EntryRef,
      entries: ReadonlyArray<SourceEntry>,
    ) => Effect.Effect<ReadonlyArray<IdentifiedEntry>>;
  }
>()("@starlight/core/FileIdentities") {
  static readonly layer = Layer.effect(FileIdentities)(
    Effect.gen(function* () {
      const store = yield* FileIdentityStore;

      const isStillAt = (driver: SourceDriver, identity: FileIdentity) =>
        driver.stat(identity.entry).pipe(
          Effect.map((entry) => entry.key === identity.key),
          Effect.orElseSucceed(() => false),
        );

      const recorded = (directory: EntryRef) =>
        Effect.map(
          store.inDirectory(directory.source, directory.id),
          (identities) =>
            new Map<EntryId, FileIdentity>(identities.map((identity) => [identity.entry, identity])),
        );

      return FileIdentities.of({
        bind: Effect.fn("FileIdentities.bind")(function* (driver, directory, entries) {
          const known = yield* recorded(directory);
          const unknown = entries.filter((entry) => !known.has(entry.id));
          const elsewhere = new Map(
            unknown.length === 0
              ? []
              : (yield* store.withKeys(
                  directory.source,
                  unknown.map((entry) => entry.key),
                )).map((identity) => [identity.key, identity]),
          );
          const candidates = unknown.flatMap((entry) => {
            const moved = elsewhere.get(entry.key);
            elsewhere.delete(entry.key);
            return moved ? [{ entry: entry.id, moved }] : [];
          });
          const relinks = new Map(
            (yield* Effect.filter(
              candidates,
              ({ moved }) => Effect.map(isStillAt(driver, moved), (stays) => !stays),
              {
                concurrency: STAT_CONCURRENCY,
              },
            )).map(({ entry, moved }) => [entry, moved.id]),
          );
          const changed: Array<FileIdentity> = [];
          for (const entry of entries) {
            const found = known.get(entry.id);
            if (found) {
              if (found.key !== entry.key) changed.push({ ...found, key: entry.key });
              continue;
            }
            changed.push({ id: relinks.get(entry.id) ?? FileId.generate(), entry: entry.id, key: entry.key });
          }
          if (changed.length > 0) yield* store.save(directory.source, directory.id, changed);
          const settled = changed.length === 0 ? known : yield* recorded(directory);
          return entries.flatMap((entry): ReadonlyArray<IdentifiedEntry> => {
            const identity = settled.get(entry.id);
            return identity ? [{ ...entry, fileId: identity.id }] : [];
          });
        }),
      });
    }),
  );
}
