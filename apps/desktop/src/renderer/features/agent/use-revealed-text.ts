import { useEffect, useRef, useState } from "react";

const CATCH_UP_MS = 160;

const isHighSurrogate = (code: number) => code >= 0xd800 && code <= 0xdbff;

export const useRevealedText = (text: string) => {
  const [length, setLength] = useState(text.length);
  const shown = useRef(length);

  useEffect(() => {
    let last = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const backlog = text.length - shown.current;
      if (backlog <= 0) return;
      let next =
        shown.current + Math.max(1, Math.round((backlog * Math.min(now - last, CATCH_UP_MS)) / CATCH_UP_MS));
      if (isHighSurrogate(text.charCodeAt(next - 1))) next += 1;
      shown.current = Math.min(next, text.length);
      last = now;
      setLength(shown.current);
      frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [text]);

  return text.slice(0, length);
};
