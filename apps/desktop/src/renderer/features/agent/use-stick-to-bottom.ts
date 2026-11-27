import { useEffect, useRef } from "react";

const PINNED_WITHIN_PX = 48;

export const useStickToBottom = (repinKey: unknown) => {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  useEffect(() => {
    const scroller = viewport.current;
    const inner = content.current;
    if (!scroller || !inner) return;
    const onScroll = () => {
      pinned.current = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= PINNED_WITHIN_PX;
    };
    const observer = new ResizeObserver(() => {
      if (pinned.current) scroller.scrollTop = scroller.scrollHeight;
    });
    scroller.addEventListener("scroll", onScroll, { passive: true });
    observer.observe(inner);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    pinned.current = true;
    const scroller = viewport.current;
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }, [repinKey]);

  return { viewport, content };
};
