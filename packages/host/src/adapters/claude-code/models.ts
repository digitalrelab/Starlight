import { type EffortLevel, query, type SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import { type AgentModel, ModelId } from "@starlight/contracts";
import { Effect, Option } from "effect";
import { findExecutable } from "./executable.ts";

const EFFORTS: Readonly<Record<EffortLevel, string>> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  xhigh: "Extra High",
  max: "Max",
};

const DEFAULT_ALIAS = "default";

export const isEffort = (effort: string): effort is EffortLevel => Object.hasOwn(EFFORTS, effort);

const load = (workingDirectory: string) =>
  Effect.gen(function* () {
    const executable = yield* findExecutable;
    if (Option.isNone(executable)) return [];
    let release = () => {};
    const closed = new Promise<void>((resolve) => {
      release = resolve;
    });
    const session = query({
      prompt: {
        [Symbol.asyncIterator]: () => ({
          next: (): Promise<IteratorResult<SDKUserMessage>> =>
            closed.then(() => ({ done: true, value: undefined })),
        }),
      },
      options: {
        pathToClaudeCodeExecutable: executable.value,
        cwd: workingDirectory,
        settingSources: [],
        tools: [],
      },
    });
    const models = yield* Effect.tryPromise(() => session.supportedModels()).pipe(
      Effect.ensuring(
        Effect.sync(() => {
          release();
          session.close();
        }),
      ),
    );
    return models
      .filter((model) => model.value !== DEFAULT_ALIAS)
      .map((model): AgentModel => ({
        id: ModelId.make(model.value),
        name: model.displayName,
        efforts: (model.supportedEffortLevels ?? []).map((effort) => ({
          id: effort,
          label: EFFORTS[effort],
        })),
      }));
  });

export const makeModels = (workingDirectory: string) => {
  let cached: ReadonlyArray<AgentModel> | undefined;
  return Effect.suspend(() =>
    cached
      ? Effect.succeed(cached)
      : load(workingDirectory).pipe(
          Effect.tap((models) =>
            Effect.sync(() => {
              cached = models;
            }),
          ),
          Effect.orElseSucceed((): ReadonlyArray<AgentModel> => []),
        ),
  );
};
