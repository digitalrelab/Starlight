import { cn } from "cn";
import { type ComponentProps, useEffect, useRef } from "react";

const HOLD_MS = 700;
const REWIND_RATE = -4;

const isPressKey = (key: string) => key === "Enter" || key === " ";

export interface HoldButtonProps extends Omit<ComponentProps<"button">, "onClick" | "type"> {
  readonly onConfirm: () => void;
}

export const HoldButton = ({ onConfirm, className, children, ...props }: HoldButtonProps) => {
  const fill = useRef<HTMLSpanElement>(null);
  const progress = useRef<Animation | null>(null);
  const held = useRef(false);

  useEffect(() => () => progress.current?.cancel(), []);

  const press = () => {
    held.current = true;
    if (progress.current) return progress.current.updatePlaybackRate(1);
    const animation = fill.current?.animate([{ scale: "0 1" }, { scale: "1 1" }], {
      duration: HOLD_MS,
      easing: "cubic-bezier(0.4, 0, 1, 1)",
      fill: "both",
    });
    if (!animation) return;
    progress.current = animation;
    animation.onfinish = () => {
      progress.current = null;
      if (held.current) return onConfirm();
      animation.cancel();
    };
  };

  const release = () => {
    if (!held.current) return;
    held.current = false;
    progress.current?.updatePlaybackRate(REWIND_RATE);
  };

  return (
    <button
      {...props}
      type="button"
      onPointerDown={(event) => {
        if (event.button === 0) press();
      }}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      onKeyDown={(event) => {
        if (!isPressKey(event.key)) return;
        event.preventDefault();
        if (!event.repeat) press();
      }}
      onKeyUp={(event) => {
        if (isPressKey(event.key)) release();
      }}
      onBlur={release}
      onContextMenu={(event) => event.preventDefault()}
      className={cn("relative isolate touch-none overflow-hidden select-none", className)}
    >
      <span ref={fill} aria-hidden className="absolute inset-0 -z-10 origin-left scale-x-0 bg-current/15" />
      {children}
    </button>
  );
};
