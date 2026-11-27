import { useEffect, useState } from "react";

const CONCURRENCY = 3;

interface Listener {
  readonly visible: boolean;
  readonly onLoad: () => void;
}

interface Request {
  readonly listeners: Set<Listener>;
  readonly order: number;
  loading: boolean;
}

const requests = new Map<string, Request>();
let active = 0;
let sequence = 0;

const isVisible = (request: Request) => {
  for (const listener of request.listeners) if (listener.visible) return true;
  return false;
};

const outranks = (a: Request, b: Request) =>
  isVisible(a) === isVisible(b) ? a.order > b.order : isVisible(a);

const next = () => {
  let best: [string, Request] | undefined;
  for (const entry of requests) {
    if (!entry[1].loading && (!best || outranks(entry[1], best[1]))) best = entry;
  }
  return best;
};

const pump = () => {
  while (active < CONCURRENCY) {
    const entry = next();
    if (!entry) return;
    const [url, request] = entry;
    const settle = (loaded: boolean) => () => {
      active--;
      requests.delete(url);
      if (loaded) for (const listener of request.listeners) listener.onLoad();
      pump();
    };
    request.loading = true;
    active++;
    const image = new Image();
    image.onload = settle(true);
    image.onerror = settle(false);
    image.src = url;
  }
};

const subscribe = (url: string, listener: Listener) => {
  const request = requests.get(url) ?? { listeners: new Set(), order: sequence++, loading: false };
  requests.set(url, request);
  request.listeners.add(listener);
  pump();
  return () => {
    request.listeners.delete(listener);
    if (request.listeners.size === 0 && !request.loading) requests.delete(url);
  };
};

export const useThumbnail = (url: string, visible: boolean) => {
  const [loaded, setLoaded] = useState<string>();
  const ready = loaded === url;
  useEffect(() => {
    if (!ready) return subscribe(url, { visible, onLoad: () => setLoaded(url) });
  }, [url, visible, ready]);
  return ready ? url : undefined;
};
