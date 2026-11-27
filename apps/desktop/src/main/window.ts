import { join } from "node:path";
import { BrowserWindow, nativeTheme, shell } from "electron";
import { Channel } from "#shared/channels.ts";
import { stepHistory } from "./history.ts";

const EXTERNAL_URL = /^(?:https?|mailto):/i;
const READY_TIMEOUT_MS = 5000;

const backgroundColor = () => (nativeTheme.shouldUseDarkColors ? "#12131c" : "#f0f1f5");

export const createWindow = () => {
  const window = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 720,
    minHeight: 480,
    show: false,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 14, y: 13 },
    backgroundColor: backgroundColor(),
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
  const followTheme = () => window.setBackgroundColor(backgroundColor());
  nativeTheme.on("updated", followTheme);
  window.once("closed", () => {
    clearTimeout(fallback);
    nativeTheme.off("updated", followTheme);
  });
  window.webContents.ipc.once(Channel.ready, show);
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (EXTERNAL_URL.test(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event) => event.preventDefault());
  window.on("swipe", (_event, direction) => {
    if (direction === "left") stepHistory(window.webContents, -1);
    else if (direction === "right") stepHistory(window.webContents, 1);
  });

  const devUrl = process.env["ELECTRON_RENDERER_URL"];
  if (devUrl) void window.loadURL(devUrl);
  else void window.loadFile(join(import.meta.dirname, "../renderer/index.html"));

  return window;
};
