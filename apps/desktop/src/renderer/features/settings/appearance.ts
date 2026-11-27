import { COLOR_SCHEMES } from "@starlight/ui";
import { defineStored, oneOf } from "../../lib/storage.ts";

export const colorScheme = defineStored("color-scheme", oneOf(COLOR_SCHEMES), "system");

export const cursor = defineStored("cursor", oneOf(["default", "pointer"]), "default");
