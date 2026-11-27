import { defineStored, oneOf } from "#renderer/lib/storage.ts";

export const inspectorPreference = defineStored("inspector", oneOf(["open", "closed"]), "closed");

export const INSPECTOR_SHORTCUT = ["Meta", "I"];
