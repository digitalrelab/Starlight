import { defineStored, oneOf } from "#renderer/lib/storage.ts";

export const hiddenFiles = defineStored("hidden-files", oneOf(["hide", "show"]), "hide");
