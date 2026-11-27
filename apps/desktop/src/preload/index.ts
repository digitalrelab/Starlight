import { ipcRenderer } from "electron";
import { Channel } from "../shared/channels.ts";

window.addEventListener("message", (event) => {
  if (event.source === window && event.data?.type === Channel.connect) ipcRenderer.send(Channel.connect);
});

ipcRenderer.on(Channel.ports, (event) => {
  window.postMessage({ type: Channel.ports }, "*", event.ports);
});
