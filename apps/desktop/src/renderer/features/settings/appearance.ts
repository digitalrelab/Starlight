import { COLOR_SCHEMES, definePreference } from "@starlight/ui";

export const colorScheme = definePreference("color-scheme", COLOR_SCHEMES, "system");

export const cursor = definePreference("cursor", ["default", "pointer"], "default");
