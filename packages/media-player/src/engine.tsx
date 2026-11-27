import { cn } from "cn";
import { type ComponentProps, createContext, use, useEffect, useEffectEvent, useState } from "react";
import { type Acknowledgement, createEcho } from "./echo.tsx";
import { play, prepare, seekBy, setVolume, toggle, toggleMute, useMediaSnapshot } from "./media.ts";
import { isOccupied, statusOf } from "./status.ts";

const SEEK_STEP = 5;
const VOLUME_STEP = 0.1;
const IGNORED_KEY_TARGETS =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="menu"], [role="menuitem"], [role="menuitemradio"], [role="option"]';

export const PLAYER_ATTRIBUTE = "data-player";

const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => setIsFullscreen(false));
    }
    return () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [isFullscreen]);

  return { isFullscreen, toggleFullscreen: () => setIsFullscreen((current) => !current) };
};

export interface EngineOptions {
  readonly src: string;
  readonly autoPlay: boolean;
  readonly hasPageShortcuts: boolean;
  readonly onKey: () => void;
}

export const usePlayerEngine = ({ src, autoPlay, hasPageShortcuts, onKey }: EngineOptions) => {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [media, setMedia] = useState<HTMLMediaElement | null>(null);
  const [echo] = useState(createEcho);
  const state = useMediaSnapshot(media);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const status = statusOf(state);

  const acknowledge = (acknowledgement: Acknowledgement) => {
    if (!isOccupied(status)) echo.acknowledge(acknowledgement);
  };

  const attachMedia = (node: HTMLMediaElement | null) => {
    setMedia(node);
    if (!node) return;
    prepare(node);
    if (autoPlay) play(node);
  };

  const togglePlayback = () => {
    if (!media) return;
    toggle(media);
    acknowledge({ kind: media.paused ? "pause" : "play" });
  };

  const bindings: Readonly<Record<string, () => void>> = media
    ? {
        " ": togglePlayback,
        k: togglePlayback,
        ArrowLeft: () => acknowledge({ kind: "seek", seconds: seekBy(media, -SEEK_STEP) }),
        ArrowRight: () => acknowledge({ kind: "seek", seconds: seekBy(media, SEEK_STEP) }),
        ArrowUp: () => acknowledge({ kind: "volume", level: setVolume(media, media.volume + VOLUME_STEP) }),
        ArrowDown: () => acknowledge({ kind: "volume", level: setVolume(media, media.volume - VOLUME_STEP) }),
        m: () => acknowledge({ kind: "volume", level: toggleMute(media) }),
        ...(media instanceof HTMLVideoElement && { f: toggleFullscreen }),
      }
    : {};

  const handleKey = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing || event.metaKey || event.ctrlKey || event.altKey) return;
    if (!(event.target instanceof Element) || event.target.closest(IGNORED_KEY_TARGETS)) return;
    const run = bindings[event.key];
    if (!run) return;
    event.preventDefault();
    run();
    onKey();
  };

  const handlePageKey = useEffectEvent((event: KeyboardEvent) => {
    const { target } = event;
    if (root && target instanceof Node && !root.contains(target) && target.contains(root)) handleKey(event);
  });

  useEffect(() => {
    if (!hasPageShortcuts) return;
    const listener = (event: KeyboardEvent) => handlePageKey(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [hasPageShortcuts]);

  useEffect(() => {
    if (state.failed && !state.paused) media?.pause();
  }, [media, state.failed, state.paused]);

  return {
    src,
    media,
    state,
    status,
    setRoot,
    handleKey,
    attachMedia,
    togglePlayback,
    echo,
    isFullscreen,
    toggleFullscreen,
    hasPageShortcuts,
  };
};

export type PlayerEngine = ReturnType<typeof usePlayerEngine>;

export const PlayerContext = createContext<PlayerEngine | null>(null);

export const usePlayer = () => {
  const engine = use(PlayerContext);
  if (engine === null) throw new Error("usePlayer needs a PlayerContext");
  return engine;
};

export const PlayerFrame = ({
  className,
  children,
  ...props
}: Omit<ComponentProps<"div">, "ref" | "tabIndex">) => {
  const { setRoot, handleKey, isFullscreen, hasPageShortcuts } = usePlayer();
  return (
    <div
      ref={setRoot}
      {...{ [PLAYER_ATTRIBUTE]: "" }}
      tabIndex={hasPageShortcuts ? undefined : -1}
      onKeyDown={(event) => handleKey(event.nativeEvent)}
      className={cn(
        "@container/player relative isolate outline-none",
        isFullscreen && "fixed inset-0 z-10 bg-black",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
