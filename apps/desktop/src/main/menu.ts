import { BrowserWindow, Menu, type MenuItemConstructorOptions } from "electron";
import { Channel } from "#shared/channels.ts";
import type { ZoomStep } from "#shared/zoom.ts";

const zoomItem = (label: string, accelerator: string, step: ZoomStep): MenuItemConstructorOptions => ({
  label,
  accelerator,
  click: () => BrowserWindow.getFocusedWindow()?.webContents.send(Channel.zoomStep, step),
});

export const installMenu = () =>
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      { role: "appMenu" },
      { role: "fileMenu" },
      { role: "editMenu" },
      {
        label: "View",
        submenu: [
          { role: "reload" },
          { role: "forceReload" },
          { role: "toggleDevTools" },
          { type: "separator" },
          zoomItem("Actual Size", "CommandOrControl+0", "reset"),
          zoomItem("Zoom In", "CommandOrControl+=", "in"),
          zoomItem("Zoom Out", "CommandOrControl+-", "out"),
          { type: "separator" },
          { role: "togglefullscreen" },
        ],
      },
      { role: "windowMenu" },
    ]),
  );
