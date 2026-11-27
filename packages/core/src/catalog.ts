import { Dimensions, type EntryId, type EntryRef, type FileId } from "@starlight/contracts";
import { Context, type Duration, Effect, Layer, Option, Schema, Stream } from "effect";
import {
  type IdentifiedEntry,
  type Extractor,
  type FactName,
  type Facts,
  FactStore,
  type ProbedFacts,
  type ProcessedFacts,
  type SourceDriver,
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
  readonly entry: IdentifiedEntry;
  readonly facts: ProcessedFacts | null;
}

const isFresh = (stored: StoredFact, entry: IdentifiedEntry, version: number) =>
  stored.size === entry.size && stored.modifiedAt === entry.modifiedAt && stored.version === version;

const byFileId = (stored: ReadonlyArray<StoredFact>) =>
  new Map<FileId, StoredFact>(stored.map((fact) => [fact.fileId, fact]));

const storedFact = (entry: IdentifiedEntry, version: number, value: string | null): StoredFact => ({
  fileId: entry.fileId,
  size: entry.size,
  modifiedAt: entry.modifiedAt,
  version,
  value,
});

export class Catalog extends Context.Service<
  Catalog,
  {
    readonly directory: <F extends keyof ProbedFacts>(
      fact: F,
      driver: SourceDriver,
      directory: EntryRef,
      entries: ReadonlyArray<IdentifiedEntry>,
    ) => Effect.Effect<ReadonlyMap<EntryId, Facts[F]>>;
    readonly entry: <F extends keyof ProbedFacts>(
      fact: F,
      driver: SourceDriver,
      entry: IdentifiedEntry,
    ) => Effect.Effect<Option.Option<Facts[F]>>;
    readonly processed: <F extends ProcessedName>(
      fact: F,
      directory: EntryRef,
      entries: ReadonlyArray<IdentifiedEntry>,
    ) => Effect.Effect<ReadonlyMap<EntryId, ProcessedFacts[F]>>;
    readonly process: (
      driver: SourceDriver,
      directory: EntryRef,
      entries: ReadonlyArray<IdentifiedEntry>,
    ) => Stream.Stream<ReadonlyArray<Processed>>;
  }
>()("@starlight/core/Catalog") {
  static readonly layer = Layer.effect(Catalog)(
    Effect.gen(function* () {
      const store = yield* FactStore;

      const resolve = <A>(
        fact: FactName,
        codec: Schema.Codec<A, string>,
        extractor: Extractor<A>,
        entries: ReadonlyArray<IdentifiedEntry>,
        stored: ReadonlyMap<FileId, StoredFact>,
      ) =>
        Effect.gen(function* () {
          const decode = Schema.decodeOption(codec);
          const encode = Schema.encodeSync(codec);
          const values = new Map<EntryId, A>();
          const stale: Array<IdentifiedEntry> = [];
          for (const entry of entries) {
            const known = stored.get(entry.fileId);
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
            fact,
            extracted.map(({ entry, value }) =>
              storedFact(
                entry,
                extractor.version,
                Option.match(value, { onNone: () => null, onSome: encode }),
              ),
            ),
          );
          return values;
        });

      const saveProcessed = <F extends ProcessedName>(fact: F, batch: ReadonlyArray<Processed>) => {
        const encode = Schema.encodeSync(codecs[fact]);
        return store.save(
          fact,
          batch.map(({ entry, facts }) =>
            storedFact(entry, processors[fact].version, facts === null ? null : encode(facts[fact])),
          ),
        );
      };

      return Catalog.of({
        directory: (fact, driver, directory, entries) =>
          Effect.gen(function* () {
            const extractor = driver.extractors[fact];
            const stored = yield* store.inDirectory({ source: directory.source, fact }, directory.id);
            return yield* resolve(
              fact,
              codecs[fact],
              extractor,
              entries.filter(extractor.accepts),
              byFileId(stored),
            );
          }),
        entry: (fact, driver, entry) =>
          Effect.gen(function* () {
            const extractor = driver.extractors[fact];
            if (!extractor.accepts(entry)) return Option.none();
            const stored = yield* store.find(fact, entry.fileId);
            const values = yield* resolve(
              fact,
              codecs[fact],
              extractor,
              [entry],
              byFileId(Option.toArray(stored)),
            );
            return Option.fromNullishOr(values.get(entry.id));
          }),
        processed: (fact, directory, entries) =>
          Effect.gen(function* () {
            const known = byFileId(
              yield* store.inDirectory({ source: directory.source, fact }, directory.id),
            );
            const decode = Schema.decodeOption(codecs[fact]);
            const values = new Map<EntryId, ProcessedFacts[typeof fact]>();
            for (const entry of entries) {
              const found = known.get(entry.fileId);
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
              const known = new Map<ProcessedName, ReadonlyMap<FileId, StoredFact>>();
              for (const fact of processedNames) {
                known.set(
                  fact,
                  byFileId(yield* store.inDirectory({ source: directory.source, fact }, directory.id)),
                );
              }
              const pending = entries.filter((entry) =>
                processedNames.some((fact) => {
                  const found = known.get(fact)?.get(entry.fileId);
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
                    Effect.forEach(processedNames, (fact) => saveProcessed(fact, batch), { discard: true }),
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
