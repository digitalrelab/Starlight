import { ipcRenderer, webFrame } from "electron";
import { Channel } from "../shared/channels.ts";

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.type === Channel.connect) ipcRenderer.send(Channel.connect);
  if (event.data?.type === Channel.zoom) {
    const factor: unknown = event.data.factor;
    if (typeof factor === "number" && Number.isFinite(factor) && factor > 0) webFrame.setZoomFactor(factor);
  }
});

ipcRenderer.on(Channel.ports, (event) => {
  window.postMessage({ type: Channel.ports }, "*", event.ports);
});
