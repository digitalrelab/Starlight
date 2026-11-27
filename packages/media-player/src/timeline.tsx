import { cn } from "cn";
import { type CSSProperties, type PointerEvent, useRef } from "react";
import { clamp, formatDuration } from "./format.ts";
import { bufferedEnd, play, progressOf, seek, seekNear, useMediaClock } from "./media.ts";

const RESTING: CSSProperties = { "--played": 0, "--buffered": 0, "--hover": 0 } as CSSProperties;

interface Props {
  readonly media: HTMLMediaElement;
  readonly duration: number;
  readonly isLive: boolean;
  readonly onScrubChange: (scrubbing: boolean) => void;
  readonly className?: string;
}

export const Timeline = ({ media, duration, isLive, onScrubChange, className }: Props) => {
  const root = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const previewTime = useRef<HTMLSpanElement>(null);
  const geometry = useRef({ left: 0, visualWidth: 0, width: 0, previewWidth: 0 });
  const scrubbing = useRef<number | null>(null);
  const liveSeek = useRef<{ pending: number | null; resume: boolean }>({ pending: null, resume: false });
  const announced = useRef("");
  const isVideo = media instanceof HTMLVideoElement;

  useMediaClock(media, isLive, (current) => {
    const element = root.current;
    if (!element) return;
    if (scrubbing.current === null) {
      element.style.setProperty("--played", String(progressOf(current.currentTime, current.duration)));
    }
    element.style.setProperty("--buffered", String(progressOf(bufferedEnd(current), current.duration)));
    const text = `${formatDuration(current.currentTime)} of ${formatDuration(current.duration)}`;
    if (text === announced.current) return;
    announced.current = text;
    element.setAttribute("aria-valuenow", String(Math.floor(current.currentTime)));
    element.setAttribute("aria-valuetext", text);
  });

  const measure = () => {
    const element = root.current;
    if (!element) return;
    if (previewTime.current) previewTime.current.textContent = formatDuration(duration);
    const rect = element.getBoundingClientRect();
    geometry.current = {
      left: rect.left,
      visualWidth: rect.width,
      width: element.offsetWidth,
      previewWidth: preview.current?.offsetWidth ?? 0,
    };
  };

  const fractionAt = (clientX: number) => {
    const { left, visualWidth } = geometry.current;
    return visualWidth > 0 ? clamp((clientX - left) / visualWidth, 0, 1) : 0;
  };

  const showPreview = (fraction: number) => {
    const element = root.current;
    const tooltip = preview.current;
    if (!element || !tooltip) return;
    const { width, previewWidth } = geometry.current;
    const half = previewWidth / 2;
    element.style.setProperty("--hover", String(fraction));
    tooltip.style.translate = `${clamp(fraction * width, half, width - half) - half}px 0`;
    if (previewTime.current) previewTime.current.textContent = formatDuration(fraction * duration);
  };

  const flushLiveSeek = () => {
    const live = liveSeek.current;
    if (live.pending === null || media.seeking) return;
    seekNear(media, live.pending);
    live.pending = null;
  };

  const scrubTo = (fraction: number) => {
    scrubbing.current = fraction;
    root.current?.style.setProperty("--played", String(fraction));
    showPreview(fraction);
    if (!isVideo) return;
    liveSeek.current.pending = fraction * duration;
    flushLiveSeek();
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !duration) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset["scrubbing"] = "";
    measure();
    if (isVideo) {
      liveSeek.current.resume = !media.paused;
      media.pause();
      media.addEventListener("seeked", flushLiveSeek);
    }
    onScrubChange(true);
    scrubTo(fractionAt(event.clientX));
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const fraction = fractionAt(event.clientX);
    if (scrubbing.current !== null) scrubTo(fraction);
    else if (event.pointerType === "mouse") showPreview(fraction);
  };

  const onLostPointerCapture = (event: PointerEvent<HTMLDivElement>) => {
    const fraction = scrubbing.current;
    if (fraction === null) return;
    scrubbing.current = null;
    delete event.currentTarget.dataset["scrubbing"];
    seek(media, fraction * duration);
    onScrubChange(false);
    if (!isVideo) return;
    media.removeEventListener("seeked", flushLiveSeek);
    liveSeek.current.pending = null;
    if (liveSeek.current.resume) play(media);
  };

  return (
    <div
      ref={root}
      role="slider"
      tabIndex={0}
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.floor(duration)}
      style={RESTING}
      className={cn("group/timeline relative h-8 min-w-0 cursor-interactive touch-none", className)}
      onPointerEnter={measure}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onLostPointerCapture={onLostPointerCapture}
    >
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-neutral transition-[height] duration-100 group-hover/timeline:h-1.5 group-data-scrubbing/timeline:h-1.5">
        <div className="absolute inset-0 origin-left scale-x-(--buffered) bg-neutral" />
        <div className="absolute inset-0 origin-left scale-x-(--hover) bg-neutral opacity-0 group-hover/timeline:opacity-100" />
        <div className="absolute inset-0 origin-left scale-x-(--played) bg-selected-bold" />
      </div>
      <div className="pointer-events-none absolute inset-0 translate-x-[calc(var(--played)*100%)]">
        <div className="absolute top-1/2 left-0 size-3.5 -translate-1/2 scale-0 rounded-full bg-white shadow-lifted transition-[scale] duration-100 group-hover/timeline:scale-100 group-focus-visible/timeline:scale-100 group-data-scrubbing/timeline:scale-100" />
      </div>
      <div
        ref={preview}
        className="pointer-events-none absolute bottom-full left-0 mb-3 rounded-lg bg-surface-overlay px-2.5 py-1 text-sm text-default opacity-0 shadow-overlay transition-opacity duration-100 group-hover/timeline:opacity-100 group-data-scrubbing/timeline:opacity-100"
      >
        <span ref={previewTime} className="tabular-nums" />
      </div>
    </div>
  );
};
