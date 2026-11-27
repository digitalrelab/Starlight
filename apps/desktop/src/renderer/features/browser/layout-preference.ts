import { definePreference } from "@starlight/ui";
import { DEFAULT_LAYOUT, type LayoutId, layoutIds } from "./layouts/registry.ts";

type LayoutPreference = ReturnType<typeof definePreference<LayoutId>>;

const preferences = new Map<string, LayoutPreference>();

export const layoutPreference = (workspaceId: string) => {
  const existing = preferences.get(workspaceId);
  if (existing) return existing;
  const created = definePreference(`starlight.layout.${workspaceId}`, layoutIds, DEFAULT_LAYOUT);
  preferences.set(workspaceId, created);
  return created;
};
