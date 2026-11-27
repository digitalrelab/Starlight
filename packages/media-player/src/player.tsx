import { cn } from "cn";
import { type PointerEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { Controls } from "./controls.tsx";
import { PlayerContext, PlayerFrame, usePlayerEngine } from "./engine.tsx";
import { Center } from "./center.tsx";
import { AudioSurface, VideoSurface } from "./surface.tsx";
import { releaseDetached } from "./visualizer.tsx";

const IDLE_DELAY_MS = 2000;

const useActivity = () => {
  const [active, setActive] = useState(false);
  const held = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const wake = () => {
    setActive(true);
    clearTimeout(timer.current);
    if (!held.current) timer.current = setTimeout(() => setActive(false), IDLE_DELAY_MS);
  };

  return {
    active,
    wake,
    hover: (isHeld: boolean) => {
      held.current = isHeld;
      wake();
    },
    rest: () => {
      held.current = false;
      clearTimeout(timer.current);
      setActive(false);
    },
  };
};

interface Props {
  readonly src: string;
  readonly autoPlay?: boolean;
  readonly hasPageShortcuts?: boolean;
  readonly failure?: ReactNode;
  readonly className?: string;
}

interface PlayerProps extends Props {
  readonly surface: ReactNode;
}

const Player = ({
  src,
  autoPlay = false,
  hasPageShortcuts = false,
  failure = "This file can’t be played",
  className,
  surface,
}: PlayerProps) => {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const controls = useRef<HTMLDivElement>(null);
  const { active, wake, hover, rest } = useActivity();
  const engine = usePlayerEngine({ src, autoPlay, hasPageShortcuts, onKey: wake });
  const { media, state, isVideo } = engine;
  const isPlaying = !state.paused && !state.buffering;

  useEffect(() => (media ? () => releaseDetached(media) : undefined), [media]);

  useEffect(() => {
    if (isPlaying) wake();
  }, [isPlaying, wake]);

  const track = (event: PointerEvent) =>
    hover(event.target instanceof Node && Boolean(controls.current?.contains(event.target)));

  const controlsVisible =
    !isVideo || active || isScrubbing || isMenuOpen || isFocusVisible || (state.paused && state.started);

  return (
    <PlayerContext value={engine}>
      <PlayerFrame
        className={cn(isPlaying && !controlsVisible && "cursor-none", className)}
        onPointerMove={track}
        onPointerDown={track}
        onPointerLeave={(event) => {
          if (event.pointerType !== "touch") rest();
        }}
        onFocus={(event) => setIsFocusVisible(event.target.matches(":focus-visible"))}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setIsFocusVisible(false);
        }}
      >
        {surface}
        <Center failure={failure} className="absolute inset-0" />
        {media && !state.failed ? (
          <Controls
            ref={controls}
            media={media}
            isVisible={controlsVisible}
            onScrubChange={setIsScrubbing}
            onMenuOpenChange={setIsMenuOpen}
          />
        ) : null}
      </PlayerFrame>
    </PlayerContext>
  );
};

const Video = ({ poster, ...props }: Props & { readonly poster?: string }) => (
  <Player {...props} surface={<VideoSurface poster={poster} />} />
);

const Audio = (props: Props) => <Player {...props} surface={<AudioSurface />} />;

export const MediaPlayer = { Video, Audio };
