import { PauseIcon, PlayIcon } from "@hugeicons-pro/core-solid-rounded";
import { Icon } from "@starlight/ui";
import { useEffectEvent, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { formatDuration } from "./format.ts";
import { createStore } from "./store.ts";
import { volumeIcon } from "./volume.ts";

export type Acknowledgement =
  | { readonly kind: "play" }
  | { readonly kind: "pause" }
  | { readonly kind: "seek"; readonly seconds: number }
  | { readonly kind: "volume"; readonly level: number };

interface Echoed {
  readonly acknowledgement: Acknowledgement;
  readonly at: number;
}

const LIFETIME_MS = 900;
const ENTER_MS = 140;
const LEAVE_MS = 320;
const EASING = "cubic-bezier(0.2, 0, 0, 1)";

const keyframesOf = (still: boolean): Keyframe[] => [
  { opacity: 0, scale: still ? 1 : 0.96, easing: EASING },
  { opacity: 1, scale: 1, offset: ENTER_MS / LIFETIME_MS },
  { opacity: 1, offset: 1 - LEAVE_MS / LIFETIME_MS, easing: "ease-in" },
  { opacity: 0, offset: 1 },
];

const isStill = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const wholeSeconds = (seconds: number) => Math.round(Math.abs(seconds));

const continued = (previous: Echoed | null, next: Acknowledgement, at: number): Acknowledgement => {
  if (next.kind !== "seek" || previous?.acknowledgement.kind !== "seek") return next;
  if (at - previous.at > LIFETIME_MS) return next;
  if (Math.sign(previous.acknowledgement.seconds) !== Math.sign(next.seconds)) return next;
  return { kind: "seek", seconds: previous.acknowledgement.seconds + next.seconds };
};

export const createEcho = () => {
  const store = createStore<Echoed | null>(null);
  return {
    get: store.get,
    subscribe: store.subscribe,
    acknowledge: (acknowledgement: Acknowledgement) => {
      if (acknowledgement.kind === "seek" && wholeSeconds(acknowledgement.seconds) === 0) return;
      const at = performance.now();
      store.set({ acknowledgement: continued(store.get(), acknowledgement, at), at });
    },
  };
};

export type Echo = ReturnType<typeof createEcho>;

const formatOffset = (seconds: number) => {
  const magnitude = wholeSeconds(seconds);
  const sign = seconds < 0 ? "−" : "+";
  return magnitude < 60 ? `${sign}${magnitude}s` : `${sign}${formatDuration(magnitude)}`;
};

const percentOf = (level: number) => `${Math.round(level * 100)}%`;

const announcementOf = (acknowledgement: Acknowledgement) => {
  switch (acknowledgement.kind) {
    case "play":
      return "Playing";
    case "pause":
      return "Paused";
    case "seek": {
      const magnitude = wholeSeconds(acknowledgement.seconds);
      const direction = acknowledgement.seconds < 0 ? "Back" : "Forward";
      return `${direction} ${magnitude} second${magnitude === 1 ? "" : "s"}`;
    }
    case "volume":
      return acknowledgement.level === 0 ? "Muted" : `Volume ${percentOf(acknowledgement.level)}`;
  }
};

const Label = ({ children }: { readonly children: string }) => (
  <span className="text-base font-medium tabular-nums">{children}</span>
);

const Readout = ({ acknowledgement }: { readonly acknowledgement: Acknowledgement }) => {
  switch (acknowledgement.kind) {
    case "play":
      return <Icon icon={PlayIcon} size={20} className="translate-x-px" />;
    case "pause":
      return <Icon icon={PauseIcon} size={20} />;
    case "seek":
      return <Label>{formatOffset(acknowledgement.seconds)}</Label>;
    case "volume":
      return (
        <>
          <Icon icon={volumeIcon(acknowledgement.level)} size={20} />
          {acknowledgement.level > 0 ? <Label>{percentOf(acknowledgement.level)}</Label> : null}
        </>
      );
  }
};

const rewindToHold = (animation: Animation) => {
  const { currentTime } = animation;
  animation.currentTime = typeof currentTime === "number" ? Math.min(currentTime, ENTER_MS) : 0;
};

export const EchoView = ({ echo }: { readonly echo: Echo }) => {
  const echoed = useSyncExternalStore(echo.subscribe, echo.get);
  const ref = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);

  const show = useEffectEvent((element: HTMLDivElement) => {
    const running = animation.current;
    if (running?.playState === "running") return rewindToHold(running);
    animation.current = element.animate(keyframesOf(isStill()), { duration: LIFETIME_MS });
  });

  useLayoutEffect(() => {
    if (echoed && ref.current) show(ref.current);
  }, [echoed]);

  return (
    <>
      {echoed ? (
        <div
          ref={ref}
          aria-hidden
          className="flex h-12 min-w-12 items-center justify-center gap-1.5 rounded-full bg-surface-overlay px-3.5 text-default opacity-0 shadow-overlay"
        >
          <Readout acknowledgement={echoed.acknowledgement} />
        </div>
      ) : null}
      <p aria-live="polite" className="sr-only">
        {echoed ? announcementOf(echoed.acknowledgement) : null}
      </p>
    </>
  );
};
