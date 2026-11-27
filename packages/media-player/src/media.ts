import { useEffect, useEffectEvent, useSyncExternalStore } from "react";
import { clamp } from "./format.ts";
import type { SettingsStore } from "./settings.ts";

export interface MediaSnapshot {
  readonly paused: boolean;
  readonly ended: boolean;
  readonly started: boolean;
  readonly hasFrame: boolean;
  readonly buffering: boolean;
  readonly failed: boolean;
  readonly muted: boolean;
  readonly level: number;
  readonly duration: number;
}

const HAVE_METADATA = 1;
const HAVE_CURRENT_DATA = 2;
const HAVE_FUTURE_DATA = 3;

const SNAPSHOT_EVENTS = [
  "play",
  "pause",
  "playing",
  "waiting",
  "seeking",
  "seeked",
  "canplay",
  "ended",
  "emptied",
  "error",
  "volumechange",
  "durationchange",
  "loadedmetadata",
  "loadeddata",
  "resize",
] as const;

const CLOCK_EVENTS = [
  "play",
  "seeking",
  "seeked",
  "timeupdate",
  "progress",
  "durationchange",
  "emptied",
] as const;

const DETACHED: MediaSnapshot = {
  paused: true,
  ended: false,
  started: false,
  hasFrame: false,
  buffering: false,
  failed: false,
  muted: false,
  level: 1,
  duration: 0,
};

const levelOf = (media: HTMLMediaElement) => (media.muted ? 0 : media.volume);

const durationOf = (media: HTMLMediaElement) => (Number.isFinite(media.duration) ? media.duration : 0);

const hasMetadata = (media: HTMLMediaElement) => media.readyState >= HAVE_METADATA;

const isPictureless = (media: HTMLMediaElement) =>
  media instanceof HTMLVideoElement && hasMetadata(media) && media.videoWidth === 0;

const readSnapshot = (media: HTMLMediaElement): MediaSnapshot => ({
  paused: media.paused,
  ended: media.ended,
  started: !media.paused || media.played.length > 0,
  hasFrame: media.readyState >= HAVE_CURRENT_DATA,
  buffering: !media.paused && media.readyState < HAVE_FUTURE_DATA,
  failed: media.error !== null || isPictureless(media),
  muted: media.muted || media.volume === 0,
  level: levelOf(media),
  duration: durationOf(media),
});

const isSameSnapshot = (a: MediaSnapshot, b: MediaSnapshot) =>
  (Object.keys(a) as Array<keyof MediaSnapshot>).every((key) => a[key] === b[key]);

const snapshots = new WeakMap<HTMLMediaElement, MediaSnapshot>();

const snapshotOf = (media: HTMLMediaElement) => {
  const next = readSnapshot(media);
  const previous = snapshots.get(media);
  if (previous && isSameSnapshot(previous, next)) return previous;
  snapshots.set(media, next);
  return next;
};

const listen = (media: HTMLMediaElement, events: ReadonlyArray<string>, listener: () => void) => {
  for (const event of events) media.addEventListener(event, listener);
  return () => {
    for (const event of events) media.removeEventListener(event, listener);
  };
};

const unsubscribed = () => {};

export const useMediaSnapshot = (media: HTMLMediaElement | null) =>
  useSyncExternalStore(
    (notify) => (media ? listen(media, SNAPSHOT_EVENTS, notify) : unsubscribed),
    () => (media ? snapshotOf(media) : DETACHED),
  );

const runClock = (media: HTMLMediaElement, tick: () => void) => {
  let frame = 0;
  const run = () => {
    frame = 0;
    tick();
    if (!media.paused) schedule();
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(run);
  };
  run();
  const unlisten = listen(media, CLOCK_EVENTS, schedule);
  return () => {
    unlisten();
    cancelAnimationFrame(frame);
  };
};

export const useMediaClock = (
  media: HTMLMediaElement | null,
  isLive: boolean,
  onTick: (media: HTMLMediaElement) => void,
) => {
  const tick = useEffectEvent(onTick);
  useEffect(() => (media && isLive ? runClock(media, () => tick(media)) : undefined), [media, isLive]);
};

export const bufferedEnd = (media: HTMLMediaElement) => {
  const { buffered, currentTime } = media;
  for (let index = buffered.length - 1; index >= 0; index--) {
    if (buffered.start(index) <= currentTime) return buffered.end(index);
  }
  return 0;
};

export const progressOf = (time: number, duration: number) =>
  duration > 0 ? clamp(time / duration, 0, 1) : 0;

export const prepare = (media: HTMLMediaElement, settings: SettingsStore) => {
  const { volume, playbackRate } = settings.get();
  media.volume = volume;
  media.defaultPlaybackRate = playbackRate;
  media.playbackRate = playbackRate;
};

export const play = (media: HTMLMediaElement) => {
  media.play().catch(() => {});
};

export const toggle = (media: HTMLMediaElement) => {
  if (media.paused) play(media);
  else media.pause();
};

export const seek = (media: HTMLMediaElement, time: number) => {
  media.currentTime = hasMetadata(media) ? clamp(time, 0, durationOf(media)) : Math.max(0, time);
};

export const seekNear = (media: HTMLMediaElement, time: number) => {
  const target = clamp(time, 0, durationOf(media));
  if (typeof media.fastSeek === "function") media.fastSeek(target);
  else media.currentTime = target;
};

export const seekBy = (media: HTMLMediaElement, delta: number) => {
  const before = media.currentTime;
  seek(media, before + delta);
  return media.currentTime - before;
};

export const setVolume = (media: HTMLMediaElement, volume: number, settings: SettingsStore) => {
  const next = clamp(volume, 0, 1);
  media.volume = next;
  media.muted = next === 0;
  if (next > 0) settings.update("volume", next);
  return levelOf(media);
};

export const toggleMute = (media: HTMLMediaElement, settings: SettingsStore) => {
  if (!media.muted && media.volume > 0) {
    media.muted = true;
  } else {
    media.muted = false;
    if (media.volume === 0) media.volume = settings.get().volume || 1;
  }
  return levelOf(media);
};

export const setPlaybackRate = (media: HTMLMediaElement, rate: number, settings: SettingsStore) => {
  media.defaultPlaybackRate = rate;
  media.playbackRate = rate;
  settings.update("playbackRate", rate);
};
