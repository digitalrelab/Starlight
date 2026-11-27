import { listen } from "./media.ts";
import type { Store } from "./store.ts";

export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export interface PlayerSettings {
  readonly volume: number;
  readonly playbackRate: number;
  readonly visualizer: boolean;
}

export type PlayerSettingsStore = Store<PlayerSettings>;

export const DEFAULT_PLAYER_SETTINGS: PlayerSettings = { volume: 1, playbackRate: 1, visualizer: true };

const isVolume = (value: unknown): value is number => typeof value === "number" && value > 0 && value <= 1;

const isPlaybackRate = (value: unknown): value is number => PLAYBACK_RATES.some((rate) => rate === value);

export const parsePlayerSettings = (value: unknown): PlayerSettings => {
  const { volume, playbackRate, visualizer }: Partial<Record<keyof PlayerSettings, unknown>> =
    typeof value === "object" && value !== null ? value : {};
  return {
    volume: isVolume(volume) ? volume : DEFAULT_PLAYER_SETTINGS.volume,
    playbackRate: isPlaybackRate(playbackRate) ? playbackRate : DEFAULT_PLAYER_SETTINGS.playbackRate,
    visualizer: typeof visualizer === "boolean" ? visualizer : DEFAULT_PLAYER_SETTINGS.visualizer,
  };
};

export const updateSetting = <Key extends keyof PlayerSettings>(
  settings: PlayerSettingsStore,
  key: Key,
  value: PlayerSettings[Key],
) => {
  const current = settings.get();
  if (current[key] !== value) settings.set({ ...current, [key]: value });
};

export const applySettings = (media: HTMLMediaElement, { volume, playbackRate }: PlayerSettings) => {
  media.volume = volume;
  media.defaultPlaybackRate = playbackRate;
  media.playbackRate = playbackRate;
};

export const recordSettings = (media: HTMLMediaElement, settings: PlayerSettingsStore) =>
  listen(media, ["volumechange", "ratechange"], () => {
    updateSetting(settings, "volume", media.volume);
    updateSetting(settings, "playbackRate", media.defaultPlaybackRate);
  });
