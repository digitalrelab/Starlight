import { Schema } from "effect";

export const AgentProviderId = Schema.String.pipe(Schema.brand("AgentProviderId"));
export type AgentProviderId = typeof AgentProviderId.Type;

export const ClaudeCodeProvider = AgentProviderId.make("claude-code");
export const CodexProvider = AgentProviderId.make("codex");

export const AgentProviderStatus = Schema.Union([
  Schema.TaggedStruct("Ready", {
    account: Schema.optionalKey(Schema.String),
    plan: Schema.optionalKey(Schema.String),
    version: Schema.optionalKey(Schema.String),
  }),
  Schema.TaggedStruct("NotReady", { message: Schema.String }),
]);
export type AgentProviderStatus = typeof AgentProviderStatus.Type;

export const ModelId = Schema.String.pipe(Schema.brand("ModelId"));
export type ModelId = typeof ModelId.Type;

export const AgentEffort = Schema.Struct({ id: Schema.String, label: Schema.String });
export type AgentEffort = typeof AgentEffort.Type;

export const AgentModel = Schema.Struct({
  id: ModelId,
  name: Schema.String,
  efforts: Schema.Array(AgentEffort),
  legacy: Schema.Boolean,
});
export type AgentModel = typeof AgentModel.Type;

export const ModelChoice = Schema.Struct({
  provider: AgentProviderId,
  model: ModelId,
  effort: Schema.NullOr(Schema.String),
});
export type ModelChoice = typeof ModelChoice.Type;

export const AgentProvider = Schema.Struct({
  id: AgentProviderId,
  name: Schema.String,
  status: AgentProviderStatus,
  models: Schema.Array(AgentModel),
});
export type AgentProvider = typeof AgentProvider.Type;

export const UsageWindow = Schema.Struct({
  label: Schema.String,
  usedPercent: Schema.Number,
  resetsAt: Schema.NullOr(Schema.Number),
  durationMs: Schema.NullOr(Schema.Number),
});
export type UsageWindow = typeof UsageWindow.Type;

export const AgentUsage = Schema.Union([
  Schema.TaggedStruct("Metered", {
    windows: Schema.Array(UsageWindow),
    resetCredits: Schema.optionalKey(Schema.Number),
  }),
  Schema.TaggedStruct("Unavailable", { message: Schema.String }),
]);
export type AgentUsage = typeof AgentUsage.Type;

export const AgentProviderUsage = Schema.Struct({ provider: AgentProviderId, usage: AgentUsage });
export type AgentProviderUsage = typeof AgentProviderUsage.Type;

export const UsagePoint = Schema.Struct({ at: Schema.Number, usedPercent: Schema.Number });
export type UsagePoint = typeof UsagePoint.Type;

const UsageWindowKey = {
  provider: AgentProviderId,
  label: Schema.String,
  resetsAt: Schema.Number,
  durationMs: Schema.Number,
};

export const UsageSeries = Schema.Struct({ ...UsageWindowKey, points: Schema.Array(UsagePoint) });
export type UsageSeries = typeof UsageSeries.Type;

export const UsagePeak = Schema.Struct({ ...UsageWindowKey, peakPercent: Schema.Number });
export type UsagePeak = typeof UsagePeak.Type;

export const UsageHistory = Schema.Struct({
  current: Schema.Array(UsageSeries),
  past: Schema.Array(UsagePeak),
});
export type UsageHistory = typeof UsageHistory.Type;
