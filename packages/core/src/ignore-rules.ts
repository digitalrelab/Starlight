import { DEFAULT_IGNORE_PATTERNS, type IgnorePattern } from "@starlight/contracts";
import { Context, Effect, Layer, Option, Stream, SubscriptionRef } from "effect";
import { IgnoreStore } from "./ports.ts";

export type IgnoreMatcher = (name: string) => boolean;

const sourceOf = (pattern: IgnorePattern) =>
  pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replaceAll("*", ".*")
    .replaceAll("?", ".");

const matcherOf = (patterns: ReadonlyArray<IgnorePattern>): IgnoreMatcher => {
  if (patterns.length === 0) return () => false;
  const expression = new RegExp(`^(?:${patterns.map(sourceOf).join("|")})$`, "i");
  return (name) => expression.test(name);
};

interface Rules {
  readonly patterns: ReadonlyArray<IgnorePattern>;
  readonly matches: IgnoreMatcher;
}

const rulesOf = (patterns: ReadonlyArray<IgnorePattern>): Rules => ({
  patterns,
  matches: matcherOf(patterns),
});

export class IgnoreRules extends Context.Service<
  IgnoreRules,
  {
    readonly patterns: Effect.Effect<ReadonlyArray<IgnorePattern>>;
    readonly matcher: Effect.Effect<IgnoreMatcher>;
    readonly replace: (patterns: ReadonlyArray<IgnorePattern>) => Effect.Effect<ReadonlyArray<IgnorePattern>>;
    readonly changes: Stream.Stream<void>;
  }
>()("@starlight/core/IgnoreRules") {
  static readonly layer = Layer.effect(IgnoreRules)(
    Effect.gen(function* () {
      const store = yield* IgnoreStore;
      const stored = yield* store.load;
      const rules = yield* SubscriptionRef.make(
        rulesOf(Option.getOrElse(stored, () => DEFAULT_IGNORE_PATTERNS)),
      );

      return IgnoreRules.of({
        patterns: Effect.map(SubscriptionRef.get(rules), ({ patterns }) => patterns),
        matcher: Effect.map(SubscriptionRef.get(rules), ({ matches }) => matches),
        replace: Effect.fn("IgnoreRules.replace")(function* (requested) {
          const patterns = [...new Set(requested)];
          yield* store.save(patterns);
          yield* SubscriptionRef.set(rules, rulesOf(patterns));
          return patterns;
        }),
        changes: SubscriptionRef.changes(rules).pipe(
          Stream.drop(1),
          Stream.map(() => undefined),
        ),
      });
    }),
  );
}
