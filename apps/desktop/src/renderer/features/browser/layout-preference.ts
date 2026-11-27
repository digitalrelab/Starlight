import { defineStoredFamily, oneOf } from "../../lib/storage.ts";
import { DEFAULT_LAYOUT, layoutIds } from "./layouts/registry.ts";

export const layoutPreference = defineStoredFamily(
  (workspaceId) => `layout.${workspaceId}`,
  oneOf(layoutIds),
  DEFAULT_LAYOUT,
);
