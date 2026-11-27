import { useEffect, useState } from "react";
import { createWorkQueue, Priority, type Work } from "#renderer/lib/work-queue.ts";

const CONCURRENCY = 3;

const previews = createWorkQueue(CONCURRENCY);

const load = (url: string): Work => ({
  key: url,
  task: () =>
    new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = url;
    }),
});

export const usePreview = (url: string, visible: boolean) => {
  const [loaded, setLoaded] = useState<string>();
  const ready = loaded === url;
  useEffect(() => {
    if (ready) return;
    return previews.request(load(url), visible ? Priority.visible : Priority.nearby, (succeeded) => {
      if (succeeded) setLoaded(url);
    });
  }, [url, visible, ready]);
  return ready ? url : undefined;
};

export const usePreviewsAhead = (urls: ReadonlyArray<string>) =>
  useEffect(() => previews.requestAll(urls.map(load), Priority.background), [urls]);
