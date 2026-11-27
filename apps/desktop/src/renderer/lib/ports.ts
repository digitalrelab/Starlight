import type { PortSources } from "@starlight/client";
import { Channel } from "../../shared/channels.ts";

const ports = new Promise<readonly [MessagePort, MessagePort]>((resolve) => {
  const onMessage = (event: MessageEvent) => {
    if (event.source !== window || event.data?.type !== Channel.ports) return;
    window.removeEventListener("message", onMessage);
    const [host, shell] = event.ports;
    if (host && shell) resolve([host, shell]);
  };
  window.addEventListener("message", onMessage);
  window.postMessage({ type: Channel.connect }, "*");
});

export const portSources: PortSources = {
  host: () => ports.then(([host]) => host),
  shell: () => ports.then(([, shell]) => shell),
};
