import { useEffect, useState } from "react";

const CONCURRENCY = 3;

interface Listener {
  readonly visible: boolean;
  readonly onLoad: () => void;
}

interface Request {
  readonly url: string;
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
  let best: Request | undefined;
  for (const request of requests.values()) {
    if (!request.loading && (!best || outranks(request, best))) best = request;
  }
  return best;
};

const pump = () => {
  while (active < CONCURRENCY) {
    const request = next();
    if (!request) return;
    const settle = (loaded: boolean) => () => {
      active--;
      requests.delete(request.url);
      if (loaded) for (const listener of request.listeners) listener.onLoad();
      pump();
    };
    request.loading = true;
    active++;
    const image = new Image();
    image.onload = settle(true);
    image.onerror = settle(false);
    image.src = request.url;
  }
};

const subscribe = (url: string, listener: Listener) => {
  const request = requests.get(url) ?? { url, listeners: new Set(), order: sequence++, loading: false };
  requests.set(url, request);
  request.listeners.add(listener);
  pump();
  return () => {
    request.listeners.delete(listener);
    if (request.listeners.size === 0 && !request.loading) requests.delete(url);
  };
};

export const usePreview = (url: string, visible: boolean) => {
  const [loaded, setLoaded] = useState<string>();
  const ready = loaded === url;
  useEffect(() => {
    if (!ready) return subscribe(url, { visible, onLoad: () => setLoaded(url) });
  }, [url, visible, ready]);
  return ready ? url : undefined;
};
