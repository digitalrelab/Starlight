import { PauseIcon, PlayIcon } from "@hugeicons-pro/core-solid-rounded";
import {
  FullScreenIcon,
  MinimizeScreenIcon,
  RefreshCcwIcon,
  Settings02Icon,
} from "@hugeicons-pro/core-stroke-rounded";
import {
  Button,
  cn,
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  Slider,
} from "@starlight/ui";
import { type ReactNode, type Ref, useLayoutEffect, useRef } from "react";
import { usePlayer } from "./engine.tsx";
import { formatDuration } from "./format.ts";
import { setPlaybackRate, setVolume, toggleMute, useMediaClock } from "./media.ts";
import { PLAYBACK_RATES, useSetting } from "./settings.ts";
import { Timeline } from "./timeline.tsx";
import { volumeIcon } from "./volume.ts";

const timeReadout = "min-w-11 px-1 text-base tabular-nums";

const PlayButton = () => {
  const { state, togglePlayback } = usePlayer();
  const label = state.ended ? "Replay" : state.paused ? "Play" : "Pause";
  const icon = state.ended ? RefreshCcwIcon : state.paused ? PlayIcon : PauseIcon;
  return <IconButton label={label} icon={icon} shortcut={["Space"]} onClick={togglePlayback} />;
};

const CurrentTime = ({ media, isLive }: { readonly media: HTMLMediaElement; readonly isLive: boolean }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const paint = (current: HTMLMediaElement) => {
    const label = formatDuration(current.currentTime);
    if (ref.current && ref.current.textContent !== label) ref.current.textContent = label;
  };
  useMediaClock(media, isLive, paint);
  useLayoutEffect(() => paint(media));
  return <span ref={ref} className={cn(timeReadout, "hidden text-right text-default @sm/player:block")} />;
};

const Volume = ({ media }: { readonly media: HTMLMediaElement }) => {
  const { state } = usePlayer();
  return (
    <div className="flex items-center">
      <IconButton
        label={state.muted ? "Unmute" : "Mute"}
        icon={volumeIcon(state.level)}
        shortcut={["m"]}
        onClick={() => toggleMute(media)}
      />
      <Slider
        aria-label="Volume"
        min={0}
        max={1}
        step={0.01}
        value={state.level}
        onValueChange={(volume) => setVolume(media, volume)}
        className="hidden w-24 px-2 @xl/player:block"
      />
    </div>
  );
};

const rateLabel = (rate: number) => (rate === 1 ? "Normal" : `${rate}×`);

const Setting = ({ label, children }: { readonly label: string; readonly children: ReactNode }) => (
  <div className="flex min-h-8 items-center justify-between gap-4 pl-2">
    <span className="text-subtle">{label}</span>
    {children}
  </div>
);

const Speed = ({ media }: { readonly media: HTMLMediaElement }) => {
  const rate = useSetting("playbackRate");
  return (
    <Select.Root value={String(rate)} onValueChange={(next) => setPlaybackRate(media, Number(next))}>
      <Select.Trigger render={<Button aria-label="Speed" className="w-32 justify-between tabular-nums" />}>
        {rateLabel(rate)}
      </Select.Trigger>
      <Select.Popup>
        {PLAYBACK_RATES.map((option) => (
          <Select.Item key={option} value={String(option)}>
            {rateLabel(option)}
          </Select.Item>
        ))}
      </Select.Popup>
    </Select.Root>
  );
};

interface SettingsProps {
  readonly media: HTMLMediaElement;
  readonly onOpenChange: (open: boolean) => void;
}

const Settings = ({ media, onOpenChange }: SettingsProps) => (
  <Popover onOpenChange={onOpenChange}>
    <PopoverTrigger render={<IconButton label="Playback settings" icon={Settings02Icon} />} />
    <PopoverContent side="top" align="end" className="w-64 gap-1 p-1.5">
      <Setting label="Speed">
        <Speed media={media} />
      </Setting>
    </PopoverContent>
  </Popover>
);

const Fullscreen = () => {
  const { isFullscreen, toggleFullscreen } = usePlayer();
  return (
    <IconButton
      label={isFullscreen ? "Exit full screen" : "Full screen"}
      icon={isFullscreen ? MinimizeScreenIcon : FullScreenIcon}
      shortcut={["f"]}
      onClick={toggleFullscreen}
    />
  );
};

interface Props {
  readonly media: HTMLMediaElement;
  readonly isVisible: boolean;
  readonly onScrubChange: (scrubbing: boolean) => void;
  readonly onMenuOpenChange: (open: boolean) => void;
  readonly ref?: Ref<HTMLDivElement>;
}

export const Controls = ({ media, isVisible, onScrubChange, onMenuOpenChange, ref }: Props) => {
  const { state } = usePlayer();
  return (
    <div
      ref={ref}
      className={cn(
        "absolute inset-x-4 bottom-4 mx-auto flex max-w-5xl items-center gap-1 rounded-xl border border-default bg-surface-overlay p-1.5 shadow-overlay",
        "transition-[opacity,translate] duration-300 ease-out",
        !isVisible && "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <PlayButton />
      <CurrentTime media={media} isLive={isVisible} />
      <Timeline
        media={media}
        duration={state.duration}
        isLive={isVisible}
        onScrubChange={onScrubChange}
        className="mx-2 flex-1"
      />
      <span className={cn(timeReadout, "hidden text-subtle @sm/player:block")}>
        {formatDuration(state.duration)}
      </span>
      <Volume media={media} />
      <Settings media={media} onOpenChange={onMenuOpenChange} />
      {media instanceof HTMLVideoElement ? <Fullscreen /> : null}
    </div>
  );
};
