import { join } from "node:path";
import { BrowserWindow, nativeTheme, shell } from "electron";
import { Channel } from "#shared/channels.ts";

const EXTERNAL_URL = /^(?:https?|mailto):/i;
const READY_TIMEOUT_MS = 5000;

export const createWindow = () => {
  const window = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 720,
    minHeight: 480,
    show: false,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 14, y: 13 },
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#12131c" : "#f0f1f5",
    webPreferences: {
      preload: join(import.meta.dirname, "../preload/index.cjs"),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const show = () => {
    clearTimeout(fallback);
    window.webContents.ipc.removeAllListeners(Channel.ready);
    window.show();
  };
  const fallback = setTimeout(show, READY_TIMEOUT_MS);
  window.once("closed", () => clearTimeout(fallback));
  window.webContents.ipc.once(Channel.ready, show);
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (EXTERNAL_URL.test(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event) => event.preventDefault());

  const devUrl = process.env["ELECTRON_RENDERER_URL"];
  if (devUrl) void window.loadURL(devUrl);
  else void window.loadFile(join(import.meta.dirname, "../renderer/index.html"));

  return window;
};
