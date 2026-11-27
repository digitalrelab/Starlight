import { join } from "node:path";
import { BrowserWindow, nativeTheme } from "electron";

export const createWindow = () => {
  const window = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 720,
    minHeight: 480,
    show: false,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 14, y: 13 },
    // `--sl-canvas` from @starlight/ui, so the window does not flash before CSS loads.
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#0e0f12" : "#f9fafb",
    webPreferences: {
      preload: join(import.meta.dirname, "../preload/index.cjs"),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.once("ready-to-show", () => window.show());
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event) => event.preventDefault());

  const devUrl = process.env["ELECTRON_RENDERER_URL"];
  if (devUrl) void window.loadURL(devUrl);
  else void window.loadFile(join(import.meta.dirname, "../renderer/index.html"));

  return window;
};
