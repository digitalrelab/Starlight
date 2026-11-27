import type { EffortLevel } from "@anthropic-ai/claude-agent-sdk";
import { type AgentModel, ModelId } from "@starlight/contracts";
import { Effect } from "effect";
import { effortLabel } from "#adapters/agent.ts";
import { COMMAND_TIMEOUT_MS } from "#adapters/cli.ts";
import type { Pool } from "./pool.ts";

const EFFORTS: ReadonlySet<string> = new Set<EffortLevel>(["low", "medium", "high", "xhigh", "max"]);

const DEFAULT_ALIAS = "default";

export const isEffort = (effort: string): effort is EffortLevel => EFFORTS.has(effort);

const load = (pool: Pool) =>
  Effect.tryPromise(() => pool.prepare().then((session) => session.models())).pipe(
    Effect.timeout(COMMAND_TIMEOUT_MS),
    Effect.map((models) =>
      models
        .filter((model) => model.value !== DEFAULT_ALIAS)
        .map((model): AgentModel => ({
          id: ModelId.make(model.value),
          name: model.displayName,
          efforts: (model.supportedEffortLevels ?? []).map((effort) => ({
            id: effort,
            label: effortLabel(effort),
          })),
        })),
    ),
  );

export const makeModels = (pool: Pool) => {
  let cached: ReadonlyArray<AgentModel> | undefined;
  return Effect.suspend(() =>
    cached
      ? Effect.succeed(cached)
      : load(pool).pipe(
          Effect.tap((models) =>
            Effect.sync(() => {
              cached = models;
            }),
          ),
          Effect.orElseSucceed((): ReadonlyArray<AgentModel> => []),
        ),
  );
};
