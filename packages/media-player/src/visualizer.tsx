import { cn } from "cn";
import { useEffect, useRef } from "react";

const BARS = 15;
const FFT_SIZE = 2048;
const LOWEST_HZ = 187.5;
const HIGHEST_HZ = 6000;
const BYTE_MAX = 255;
const FLOOR = 0.2;
const CONTRAST = 1.6;
const ATTACK = 0.6;
const RELEASE = 0.18;

let context: AudioContext | undefined;
const analysers = new WeakMap<HTMLMediaElement, AnalyserNode>();

const analyserOf = async (media: HTMLMediaElement) => {
  const existing = analysers.get(media);
  if (existing) return existing;
  context ??= new AudioContext();
  await context.resume();
  if (context.state !== "running" || analysers.has(media)) return analysers.get(media);
  const analyser = context.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  context.createMediaElementSource(media).connect(analyser);
  analyser.connect(context.destination);
  analysers.set(media, analyser);
  return analyser;
};

const bandsOf = (analyser: AnalyserNode) => {
  const binHz = analyser.context.sampleRate / analyser.fftSize;
  const edge = (band: number) => Math.floor((LOWEST_HZ * (HIGHEST_HZ / LOWEST_HZ) ** (band / BARS)) / binHz);
  return Array.from(
    { length: BARS },
    (_, band) => [edge(band), Math.max(edge(band) + 1, edge(band + 1))] as const,
  );
};

const slotOf = (band: number) => (BARS - 1) / 2 + (band % 2 ? -(band + 1) / 2 : band / 2);

interface Props {
  readonly media: HTMLMediaElement;
  readonly active: boolean;
  readonly className?: string;
}

export const Visualizer = ({ media, active, className }: Props) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!active || !root) return;
    const bars = Array.from(root.children, (bar) => bar as HTMLElement);
    const levels = new Float32Array(BARS).fill(FLOOR);
    let frame = 0;
    let cancelled = false;

    void analyserOf(media).then((analyser) => {
      if (cancelled || !analyser) return;
      const bins = new Uint8Array(analyser.frequencyBinCount);
      const bands = bandsOf(analyser);
      root.dataset["live"] = "";
      const draw = () => {
        analyser.getByteFrequencyData(bins);
        bands.forEach(([start, end], band) => {
          let peak = 0;
          for (let bin = start; bin < end; bin++) peak = Math.max(peak, bins[bin] ?? 0);
          const level = levels[band] ?? FLOOR;
          const target = Math.max(FLOOR, (peak / BYTE_MAX) ** CONTRAST);
          const next = level + (target - level) * (target > level ? ATTACK : RELEASE);
          levels[band] = next;
          bars[slotOf(band)]?.style.setProperty("height", `${next * 100}%`);
        });
        frame = requestAnimationFrame(draw);
      };
      draw();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      delete root.dataset["live"];
      for (const bar of bars) bar.style.removeProperty("height");
    };
  }, [media, active]);

  return (
    <div ref={ref} aria-hidden className={cn("group/visualizer flex items-center gap-3", className)}>
      {Array.from({ length: BARS }, (_, slot) => (
        <span
          key={slot}
          className="h-1/5 flex-1 rounded-full bg-current transition-[height] duration-300 ease-out group-data-live/visualizer:transition-none"
        />
      ))}
    </div>
  );
};
