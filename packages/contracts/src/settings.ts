import { Schema, Struct } from "effect";

export const Theme = Schema.Literals(["system", "light", "dark"]);
export type Theme = typeof Theme.Type;

export const Settings = Schema.Struct({
  pointerCursors: Schema.Boolean,
  theme: Theme,
});
export type Settings = typeof Settings.Type;

export const SettingsPatch = Settings.mapFields(Struct.map(Schema.optionalKey));
export type SettingsPatch = typeof SettingsPatch.Type;

export const defaultSettings: Settings = {
  pointerCursors: false,
  theme: "system",
};
