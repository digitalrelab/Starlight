import { Schema } from "effect";

export const ColorScheme = Schema.Literals(["system", "light", "dark"]);
export type ColorScheme = typeof ColorScheme.Type;
