import { createContext, use, useSyncExternalStore } from "react";
import { createStore } from "./store.ts";

export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export interface PlayerSettings {
  readonly volume: number;
  readonly playbackRate: number;
}

const DEFAULT_SETTINGS: PlayerSettings = { volume: 1, playbackRate: 1 };

export const createSettingsStore = (initial: Partial<PlayerSettings> = {}) => {
  const store = createStore<PlayerSettings>({ ...DEFAULT_SETTINGS, ...initial });
  return {
    ...store,
    update: <Key extends keyof PlayerSettings>(key: Key, value: PlayerSettings[Key]) =>
      store.set({ ...store.get(), [key]: value }),
  };
};

export type SettingsStore = ReturnType<typeof createSettingsStore>;

export const PlayerSettingsContext = createContext<SettingsStore>(createSettingsStore());

export const usePlayerSettings = () => use(PlayerSettingsContext);

export const useSetting = <Key extends keyof PlayerSettings>(key: Key) => {
  const settings = usePlayerSettings();
  return useSyncExternalStore(settings.subscribe, () => settings.get()[key]);
};
