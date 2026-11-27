import type { PortSources } from "@starlight/client";
import { Channel } from "#shared/channels.ts";
import { onMainMessage } from "./main-messages.ts";

const ports = new Promise<readonly [MessagePort, MessagePort]>((resolve) => {
  const stop = onMainMessage(Channel.ports, (event) => {
    stop();
    const [host, shell] = event.ports;
    if (host && shell) resolve([host, shell]);
  });
  window.postMessage({ type: Channel.connect }, "*");
});

export const portSources: PortSources = {
  host: () => ports.then(([host]) => host),
  shell: () => ports.then(([, shell]) => shell),
};
