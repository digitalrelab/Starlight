import { Schema } from "effect";

export const AgentProviderId = Schema.String.pipe(Schema.brand("AgentProviderId"));
export type AgentProviderId = typeof AgentProviderId.Type;

export const AgentProviderStatus = Schema.Union([
  Schema.TaggedStruct("Ready", {
    account: Schema.optionalKey(Schema.String),
    plan: Schema.optionalKey(Schema.String),
    version: Schema.optionalKey(Schema.String),
  }),
  Schema.TaggedStruct("NotReady", {
    reason: Schema.Literals(["NotInstalled", "SignedOut", "Failed"]),
    message: Schema.String,
  }),
]);
export type AgentProviderStatus = typeof AgentProviderStatus.Type;

export const AgentProvider = Schema.Struct({
  id: AgentProviderId,
  name: Schema.String,
  status: AgentProviderStatus,
});
export type AgentProvider = typeof AgentProvider.Type;
