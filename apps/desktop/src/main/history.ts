import { BrowserWindow, Menu, type MenuItemConstructorOptions, type WebContents } from "electron";
import { Channel } from "#shared/channels.ts";
import type { HistoryAvailability } from "#shared/history.ts";

const STEPS = { back: -1, forward: 1 } as const;
type Direction = keyof typeof STEPS;

const canStep = ({ navigationHistory }: WebContents, direction: Direction) =>
  navigationHistory.canGoToOffset(STEPS[direction]);

const step = (webContents: WebContents, direction: Direction) => {
  if (canStep(webContents, direction)) webContents.navigationHistory.goToOffset(STEPS[direction]);
};

const item = (direction: Direction, label: string, accelerator: string): MenuItemConstructorOptions => ({
  id: direction,
  label,
  accelerator,
  click: () => {
    const window = BrowserWindow.getFocusedWindow();
    if (window) step(window.webContents, direction);
  },
});

export const historyMenu: MenuItemConstructorOptions = {
  label: "Go",
  submenu: [item("back", "Back", "CommandOrControl+["), item("forward", "Forward", "CommandOrControl+]")],
};

const availabilityOf = (webContents: WebContents): HistoryAvailability => ({
  back: canStep(webContents, "back"),
  forward: canStep(webContents, "forward"),
});

export const watchHistory = (window: BrowserWindow) => {
  const { webContents } = window;
  const publish = () => {
    const availability = availabilityOf(webContents);
    webContents.send(Channel.history, availability);
    if (!window.isFocused()) return;
    const menu = Menu.getApplicationMenu();
    for (const direction of Object.keys(STEPS) as Array<Direction>) {
      const menuItem = menu?.getMenuItemById(direction);
      if (menuItem) menuItem.enabled = availability[direction];
    }
  };
  webContents.on("did-navigate", publish);
  webContents.on("did-navigate-in-page", publish);
  webContents.ipc.on(Channel.historyRequest, publish);
  window.on("focus", publish);
  window.on("swipe", (_event, direction) => {
    if (direction === "left") step(webContents, "back");
    else if (direction === "right") step(webContents, "forward");
  });
};
