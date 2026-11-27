import type { AgentProviderStatus, AgentUsage } from "@starlight/contracts";

export const AGENT_INSTRUCTIONS =
  "You are the assistant inside Starlight, a desktop file manager. Answer clearly and concisely. You cannot see or change the user's files yet.";

const EFFORT_LABELS: Readonly<Record<string, string>> = { xhigh: "Extra High" };

export const capitalized = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const effortLabel = (effort: string) => EFFORT_LABELS[effort] ?? capitalized(effort);

export const asError = (cause: unknown) => (cause instanceof Error ? cause : new Error(String(cause)));

export const notReady = (message: string): AgentProviderStatus => ({ _tag: "NotReady", message });

export const unmetered = (message: string): AgentUsage => ({ _tag: "Unmetered", message });
