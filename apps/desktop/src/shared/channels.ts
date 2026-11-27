/** IPC channels for the renderer ↔ preload ↔ main port handshake. */
export const Channel = {
  connect: "starlight:connect",
  ports: "starlight:ports",
} as const;
