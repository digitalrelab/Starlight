import { definePreferenceFamily } from "@starlight/ui";
import { DEFAULT_LAYOUT, layoutIds } from "./layouts/registry.ts";

export const layoutPreference = definePreferenceFamily(
  (workspaceId) => `starlight.layout.${workspaceId}`,
  layoutIds,
  DEFAULT_LAYOUT,
);
