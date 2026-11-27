import { useEffect, useRef } from "react";

const PINNED_WITHIN_PX = 48;

export const useStickToBottom = (pin: unknown) => {
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  useEffect(() => {
    const viewport = scroller.current;
    const inner = content.current;
    if (!viewport || !inner) return;
    const onScroll = () => {
      pinned.current = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= PINNED_WITHIN_PX;
    };
    const observer = new ResizeObserver(() => {
      if (pinned.current) viewport.scrollTop = viewport.scrollHeight;
    });
    viewport.addEventListener("scroll", onScroll, { passive: true });
    observer.observe(inner);
    return () => {
      viewport.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    pinned.current = true;
    const viewport = scroller.current;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [pin]);

  return { scroller, content };
};
