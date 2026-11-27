import { useEffect, useState } from "react";
import { createWorkQueue, Priority, type Work } from "#renderer/lib/work-queue.ts";

const CONCURRENCY = 3;
const LOADED_LIMIT = 4096;

const previews = createWorkQueue(CONCURRENCY);

const loaded = new Set<string>();

const remember = (url: string) => {
  loaded.add(url);
  if (loaded.size > LOADED_LIMIT) loaded.delete(loaded.values().next().value as string);
};

const load = (url: string): Work => ({
  key: url,
  task: () =>
    new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        remember(url);
        resolve(true);
      };
      image.onerror = () => resolve(false);
      image.src = url;
    }),
});

export const usePreview = (url: string, visible: boolean) => {
  const [shown, setShown] = useState(() => (loaded.has(url) ? url : undefined));
  const [instant] = useState(shown !== undefined);
  const ready = shown === url || loaded.has(url);
  useEffect(() => {
    if (ready) return;
    return previews.request(load(url), visible ? Priority.visible : Priority.nearby, (succeeded) =>
      setShown(succeeded ? url : undefined),
    );
  }, [url, visible, ready]);
  return { src: ready ? url : shown, instant };
};

export const usePreviewsAhead = (urls: ReadonlyArray<string>) =>
  useEffect(
    () => previews.requestAll(urls.filter((url) => !loaded.has(url)).map(load), Priority.background),
    [urls],
  );
