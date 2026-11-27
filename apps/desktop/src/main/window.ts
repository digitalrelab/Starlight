import { join } from "node:path";
import { BrowserWindow, nativeTheme, shell } from "electron";

const EXTERNAL_URL = /^(?:https?|mailto):/i;

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

  window.once("ready-to-show", () => window.show());
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
