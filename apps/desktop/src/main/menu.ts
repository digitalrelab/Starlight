import { BrowserWindow, Menu, type MenuItemConstructorOptions } from "electron";
import { Channel } from "#shared/channels.ts";
import { COMMAND_PALETTE_KEY } from "#shared/command-palette.ts";
import type { ZoomStep } from "#shared/zoom.ts";
import { historyMenu } from "./history.ts";

const sendToFocused = (channel: string, ...args: ReadonlyArray<unknown>) =>
  BrowserWindow.getFocusedWindow()?.webContents.send(channel, ...args);

const zoomItem = (label: string, accelerator: string, step: ZoomStep): MenuItemConstructorOptions => ({
  label,
  accelerator,
  click: () => sendToFocused(Channel.zoomStep, step),
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
          {
            label: "Command Palette…",
            accelerator: `CommandOrControl+${COMMAND_PALETTE_KEY}`,
            click: () => sendToFocused(Channel.commandPalette),
          },
          { type: "separator" },
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
      historyMenu,
      { role: "windowMenu" },
    ]),
  );
