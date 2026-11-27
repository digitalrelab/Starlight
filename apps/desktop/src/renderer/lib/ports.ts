import type { PortSources } from "@starlight/client";

/** Handshake with the preload script. See src/preload/index.ts. */
const ports = new Promise<readonly [MessagePort, MessagePort]>((resolve) => {
  const onMessage = (event: MessageEvent) => {
    if (event.source !== window || event.data?.type !== "starlight:ports") return;
    window.removeEventListener("message", onMessage);
    const [host, shell] = event.ports;
    if (host && shell) resolve([host, shell]);
  };
  window.addEventListener("message", onMessage);
  window.postMessage({ type: "starlight:connect" }, "*");
});

export const portSources: PortSources = {
  host: () => ports.then(([host]) => host),
  shell: () => ports.then(([, shell]) => shell),
};
