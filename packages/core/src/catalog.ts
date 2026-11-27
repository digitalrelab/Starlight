import { Dimensions, type EntryId, type EntryRef } from "@starlight/contracts";
import { Context, type Duration, Effect, Layer, Option, Schema, Stream } from "effect";
import {
  type Extractor,
  type FactName,
  type Facts,
  type FactScope,
  FactStore,
  type ProbedFacts,
  type ProcessedFacts,
  type SourceDriver,
  type SourceEntry,
  type StoredFact,
} from "./ports.ts";
import { processedNames, processSample, processors } from "./processors.ts";

const EXTRACT_CONCURRENCY = 32;
const SAMPLE_CONCURRENCY = 3;
const BATCH_SIZE = 24;
const BATCH_WINDOW: Duration.Input = "300 millis";

const codecs: { readonly [F in FactName]: Schema.Codec<Facts[F], string> } = {
  dimensions: Schema.fromJsonString(Dimensions),
  placeholder: Schema.fromJsonString(Schema.String),
};

type ProcessedName = keyof ProcessedFacts;

export interface Processed {
  readonly entry: SourceEntry;
  readonly facts: ProcessedFacts | null;
}

const isFresh = (stored: StoredFact, entry: SourceEntry, version: number) =>
  stored.size === entry.size && stored.modifiedAt === entry.modifiedAt && stored.version === version;

export class Catalog extends Context.Service<
  Catalog,
  {
    readonly directory: <F extends keyof ProbedFacts>(
      fact: F,
      driver: SourceDriver,
      directory: EntryRef,
      entries: ReadonlyArray<SourceEntry>,
    ) => Effect.Effect<ReadonlyMap<EntryId, Facts[F]>>;
    readonly entry: <F extends keyof ProbedFacts>(
      fact: F,
      driver: SourceDriver,
      file: EntryRef,
      entry: SourceEntry,
    ) => Effect.Effect<Option.Option<Facts[F]>>;
    readonly processed: <F extends ProcessedName>(
      fact: F,
      directory: EntryRef,
      entries: ReadonlyArray<SourceEntry>,
    ) => Effect.Effect<ReadonlyMap<EntryId, ProcessedFacts[F]>>;
    readonly process: (
      driver: SourceDriver,
      directory: EntryRef,
      entries: ReadonlyArray<SourceEntry>,
    ) => Stream.Stream<ReadonlyArray<Processed>>;
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
          const decode = Schema.decodeOption(codec);
          const encode = Schema.encodeSync(codec);
          const values = new Map<EntryId, A>();
          const stale: Array<SourceEntry> = [];
          for (const entry of entries) {
            const known = stored.get(entry.id);
            if (!known || !isFresh(known, entry, extractor.version)) stale.push(entry);
            else if (known.value !== null) {
              const decoded = decode(known.value);
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
              value: Option.match(value, { onNone: () => null, onSome: encode }),
            })),
          );
          return values;
        });

      const saveProcessed = <F extends ProcessedName>(
        fact: F,
        directory: EntryRef,
        batch: ReadonlyArray<Processed>,
      ) => {
        const encode = Schema.encodeSync(codecs[fact]);
        return store.save(
          { source: directory.source, fact },
          directory.id,
          batch.map(({ entry, facts }) => ({
            entry: entry.id,
            size: entry.size,
            modifiedAt: entry.modifiedAt,
            version: processors[fact].version,
            value: facts === null ? null : encode(facts[fact]),
          })),
        );
      };

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
        processed: (fact, directory, entries) =>
          Effect.gen(function* () {
            const stored = yield* store.inDirectory({ source: directory.source, fact }, directory.id);
            const known = new Map(stored.map((known) => [known.entry, known]));
            const decode = Schema.decodeOption(codecs[fact]);
            const values = new Map<EntryId, ProcessedFacts[typeof fact]>();
            for (const entry of entries) {
              const found = known.get(entry.id);
              if (!found || found.value === null || !isFresh(found, entry, processors[fact].version))
                continue;
              const decoded = decode(found.value);
              if (Option.isSome(decoded)) values.set(entry.id, decoded.value);
            }
            return values;
          }),
        process: (driver, directory, entries) =>
          Stream.unwrap(
            Effect.gen(function* () {
              const ids = new Set(entries.map((entry) => entry.id));
              const known = new Map<ProcessedName, ReadonlyMap<EntryId, StoredFact>>();
              for (const fact of processedNames) {
                const scope = { source: directory.source, fact };
                const stored = yield* store.inDirectory(scope, directory.id);
                const gone = stored.filter((found) => !ids.has(found.entry)).map((found) => found.entry);
                if (gone.length > 0) yield* store.forget(scope, gone);
                known.set(fact, new Map(stored.map((found) => [found.entry, found])));
              }
              const pending = entries.filter((entry) =>
                processedNames.some((fact) => {
                  const found = known.get(fact)?.get(entry.id);
                  return !found || !isFresh(found, entry, processors[fact].version);
                }),
              );
              return Stream.fromIterable(pending).pipe(
                Stream.mapEffect(
                  (entry) =>
                    driver.sample(entry).pipe(
                      Effect.map((sample): Processed => ({
                        entry,
                        facts: Option.getOrNull(Option.map(sample, processSample)),
                      })),
                      Effect.option,
                    ),
                  { concurrency: SAMPLE_CONCURRENCY },
                ),
                Stream.filter(Option.isSome),
                Stream.map((processed) => processed.value),
                Stream.groupedWithin(BATCH_SIZE, BATCH_WINDOW),
                Stream.mapEffect((batch) =>
                  Effect.as(
                    Effect.forEach(processedNames, (fact) => saveProcessed(fact, directory, batch), {
                      discard: true,
                    }),
                    batch,
                  ),
                ),
              );
            }),
          ),
      });
    }),
  );
}
