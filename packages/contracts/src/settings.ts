import { Schema, Struct } from "effect";

export const Settings = Schema.Struct({
  pointerCursors: Schema.Boolean,
});
export type Settings = typeof Settings.Type;

export const SettingsPatch = Settings.mapFields(Struct.map(Schema.optionalKey));
export type SettingsPatch = typeof SettingsPatch.Type;

export const defaultSettings: Settings = {
  pointerCursors: false,
};
