import { ipcRenderer, webFrame } from "electron";
import { Channel } from "#shared/channels.ts";

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.type === Channel.connect) ipcRenderer.send(Channel.connect);
  if (event.data?.type === Channel.ready) ipcRenderer.send(Channel.ready);
  if (event.data?.type === Channel.colorScheme) ipcRenderer.send(Channel.colorScheme, event.data.scheme);
  if (event.data?.type === Channel.historyRequest) ipcRenderer.send(Channel.historyRequest);
  if (event.data?.type === Channel.zoom) {
    const factor: unknown = event.data.factor;
    if (typeof factor === "number" && Number.isFinite(factor) && factor > 0) webFrame.setZoomFactor(factor);
  }
});

ipcRenderer.on(Channel.ports, (event) => {
  window.postMessage({ type: Channel.ports }, "*", event.ports);
});

ipcRenderer.on(Channel.history, (_event, availability) => {
  window.postMessage({ type: Channel.history, availability }, "*");
});

ipcRenderer.on(Channel.zoomStep, (_event, step) => {
  window.postMessage({ type: Channel.zoomStep, step }, "*");
});

ipcRenderer.on(Channel.commandPalette, () => {
  window.postMessage({ type: Channel.commandPalette }, "*");
});
