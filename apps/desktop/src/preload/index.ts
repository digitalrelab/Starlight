/** Page posts `starlight:connect` → main replies with ports → forwarded to the page. Nothing else is exposed. */
import { ipcRenderer } from "electron";

window.addEventListener("message", (event) => {
  if (event.source === window && event.data?.type === "starlight:connect") {
    ipcRenderer.send("starlight:connect");
  }
});

ipcRenderer.on("starlight:ports", (event) => {
  window.postMessage({ type: "starlight:ports" }, "*", event.ports);
});
