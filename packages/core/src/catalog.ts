import { Dimensions, type EntryId, type EntryRef } from "@starlight/contracts";
import { Context, Effect, Layer, Option, Schema } from "effect";
import {
  type Extractor,
  type FactName,
  type Facts,
  type FactScope,
  FactStore,
  type SourceDriver,
  type SourceEntry,
  type StoredFact,
} from "./ports.ts";

const EXTRACT_CONCURRENCY = 32;

const codecs: { readonly [F in FactName]: Schema.Codec<Facts[F], string> } = {
  dimensions: Schema.fromJsonString(Dimensions),
};

const isFresh = (stored: StoredFact, entry: SourceEntry, version: number) =>
  stored.size === entry.size && stored.modifiedAt === entry.modifiedAt && stored.version === version;

export class Catalog extends Context.Service<
  Catalog,
  {
    readonly directory: <F extends FactName>(
      fact: F,
      driver: SourceDriver,
      directory: EntryRef,
      entries: ReadonlyArray<SourceEntry>,
    ) => Effect.Effect<ReadonlyMap<EntryId, Facts[F]>>;
    readonly entry: <F extends FactName>(
      fact: F,
      driver: SourceDriver,
      file: EntryRef,
      entry: SourceEntry,
    ) => Effect.Effect<Option.Option<Facts[F]>>;
  }
>()("@starlight/core/Catalog") {
  static readonly layer = Layer.effect(Catalog)(
    Effect.gen(function* () {
      const store = yield* FactStore;

      const resolve = <A>(
        scope: FactScope,
        codec: Schema.Codec<A, string>,
        extractor: Extractor<A>,
        directory: EntryId,
        entries: ReadonlyArray<SourceEntry>,
        stored: ReadonlyMap<EntryId, StoredFact>,
      ) =>
        Effect.gen(function* () {
          const values = new Map<EntryId, A>();
          const stale: Array<SourceEntry> = [];
          for (const entry of entries) {
            const known = stored.get(entry.id);
            if (!known || !isFresh(known, entry, extractor.version)) stale.push(entry);
            else if (known.value !== null) {
              const decoded = Schema.decodeOption(codec)(known.value);
              if (Option.isSome(decoded)) values.set(entry.id, decoded.value);
              else stale.push(entry);
            }
          }
          if (stale.length === 0) return values;
          const extracted = yield* Effect.forEach(
            stale,
            (entry) => Effect.map(extractor.extract(entry), (value) => ({ entry, value })),
            { concurrency: EXTRACT_CONCURRENCY },
          );
          for (const { entry, value } of extracted) {
            if (Option.isSome(value)) values.set(entry.id, value.value);
          }
          yield* store.save(
            scope,
            directory,
            extracted.map(({ entry, value }) => ({
              entry: entry.id,
              size: entry.size,
              modifiedAt: entry.modifiedAt,
              version: extractor.version,
              value: Option.match(value, { onNone: () => null, onSome: Schema.encodeSync(codec) }),
            })),
          );
          return values;
        });

      return Catalog.of({
        directory: (fact, driver, directory, entries) =>
          Effect.gen(function* () {
            const scope = { source: directory.source, fact };
            const extractor = driver.extractors[fact];
            const accepted = entries.filter(extractor.accepts);
            const ids = new Set(accepted.map((entry) => entry.id));
            const stored = yield* store.inDirectory(scope, directory.id);
            const gone = stored.filter((known) => !ids.has(known.entry)).map((known) => known.entry);
            if (gone.length > 0) yield* store.forget(scope, gone);
            return yield* resolve(
              scope,
              codecs[fact],
              extractor,
              directory.id,
              accepted,
              new Map(stored.map((known) => [known.entry, known])),
            );
          }),
        entry: (fact, driver, file, entry) =>
          Effect.gen(function* () {
            const scope = { source: file.source, fact };
            const extractor = driver.extractors[fact];
            if (!extractor.accepts(entry)) return Option.none();
            const stored = yield* store.find(scope, file.id);
            const values = yield* resolve(
              scope,
              codecs[fact],
              extractor,
              driver.parent(file.id),
              [entry],
              new Map(Option.toArray(stored).map((known) => [known.entry, known])),
            );
            return Option.fromNullishOr(values.get(entry.id));
          }),
      });
    }),
  );
}
