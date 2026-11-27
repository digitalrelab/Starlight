import { defineStoredFamily, oneOf } from "#renderer/lib/storage.ts";
import { DEFAULT_LAYOUT, layoutIds } from "./layouts/registry.ts";

export const layoutPreference = defineStoredFamily(
  (projectId) => `layout.${projectId}`,
  oneOf(layoutIds),
  DEFAULT_LAYOUT,
);
