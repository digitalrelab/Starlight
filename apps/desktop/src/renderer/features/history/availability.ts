import { useSyncExternalStore } from "react";
import { Channel } from "#shared/channels.ts";
import type { HistoryAvailability } from "#shared/history.ts";

let current: HistoryAvailability = { back: false, forward: false };
const listeners = new Set<() => void>();

window.addEventListener("message", (event) => {
  if (event.source !== window || event.data?.type !== Channel.history) return;
  current = event.data.availability;
  for (const listener of listeners) listener();
});
window.postMessage({ type: Channel.historyRequest }, "*");

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useHistoryAvailability = () => useSyncExternalStore(subscribe, () => current);
