import { useSyncExternalStore } from "react";
import { createStore } from "./store.ts";

export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

interface PlayerSettings {
  readonly volume: number;
  readonly playbackRate: number;
}

const store = createStore<PlayerSettings>({ volume: 1, playbackRate: 1 });

export const settings = {
  get: store.get,
  subscribe: store.subscribe,
  update: <Key extends keyof PlayerSettings>(key: Key, value: PlayerSettings[Key]) =>
    store.set({ ...store.get(), [key]: value }),
};

export const useSetting = <Key extends keyof PlayerSettings>(key: Key) =>
  useSyncExternalStore(settings.subscribe, () => settings.get()[key]);
