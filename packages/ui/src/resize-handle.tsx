import { cn } from "cn";
import type { KeyboardEvent, PointerEvent } from "react";

const KEYBOARD_STEP = 16;

export interface ResizeHandleProps {
  readonly controls: string;
  readonly label: string;
  readonly size: number;
  readonly min: number;
  readonly max: number;
  readonly onResize: (size: number) => void;
  readonly onReset: () => void;
}

export const ResizeHandle = ({ controls, label, size, min, max, onResize, onReset }: ResizeHandleProps) => {
  const clamp = (value: number) => Math.round(Math.min(max, Math.max(min, value)));

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const pane = document.getElementById(controls);
    if (event.button !== 0 || !pane) return;
    event.preventDefault();
    const handle = event.currentTarget;
    const startX = event.clientX;
    const start = pane.offsetWidth;
    let next = start;
    handle.setPointerCapture(event.pointerId);
    handle.dataset["dragging"] = "";
    document.documentElement.style.cursor = "col-resize";

    const move = (moved: globalThis.PointerEvent) => {
      next = clamp(start + moved.clientX - startX);
      pane.style.width = `${next}px`;
    };
    const end = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("lostpointercapture", end);
      delete handle.dataset["dragging"];
      document.documentElement.style.cursor = "";
      if (next !== start) onResize(next);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("lostpointercapture", end);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const step = event.shiftKey ? KEYBOARD_STEP * 4 : KEYBOARD_STEP;
    const next = { ArrowLeft: size - step, ArrowRight: size + step, Home: min, End: max }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onResize(clamp(next));
  };

  return (
    <div className="relative w-2 shrink-0">
      <div
        role="separator"
        tabIndex={0}
        aria-controls={controls}
        aria-label={label}
        aria-orientation="vertical"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={size}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        onDoubleClick={onReset}
        className="peer absolute inset-y-0 left-1/2 w-3 -translate-x-1/2 cursor-col-resize touch-none outline-none"
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-2 left-1/2 w-0.5 -translate-x-1/2 rounded-full",
          "bg-linear-to-b from-transparent via-(--border-color-brand) to-transparent",
          "opacity-0 transition-opacity duration-150",
          "peer-hover:opacity-100 peer-hover:delay-300",
          "peer-focus-visible:opacity-100 peer-focus-visible:delay-0",
          "peer-data-dragging:opacity-100 peer-data-dragging:delay-0",
        )}
      />
    </div>
  );
};
