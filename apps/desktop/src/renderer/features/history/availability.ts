import { Channel } from "#shared/channels.ts";
import type { HistoryAvailability } from "#shared/history.ts";
import { onMainMessage } from "#renderer/lib/main-messages.ts";
import { defineStore, useStore } from "#renderer/lib/store.ts";

const availability = defineStore<HistoryAvailability>({ back: false, forward: false });

onMainMessage(Channel.history, (event) => availability.set(event.data.availability));
window.postMessage({ type: Channel.historyRequest }, "*");

export const useHistoryAvailability = () => useStore(availability);
