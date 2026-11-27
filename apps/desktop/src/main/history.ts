import { BrowserWindow, Menu, type MenuItemConstructorOptions, type WebContents } from "electron";
import { Channel } from "#shared/channels.ts";
import {
  HISTORY_DIRECTIONS,
  type HistoryAvailability,
  type HistoryDirection,
  historyDirections,
} from "#shared/history.ts";

const canStep = ({ navigationHistory }: WebContents, direction: HistoryDirection) =>
  navigationHistory.canGoToOffset(HISTORY_DIRECTIONS[direction].offset);

const step = (webContents: WebContents, direction: HistoryDirection) => {
  if (canStep(webContents, direction)) {
    webContents.navigationHistory.goToOffset(HISTORY_DIRECTIONS[direction].offset);
  }
};

export const historyMenu: MenuItemConstructorOptions = {
  label: "Go",
  submenu: historyDirections.map((direction) => ({
    id: direction,
    label: HISTORY_DIRECTIONS[direction].label,
    accelerator: `CommandOrControl+${HISTORY_DIRECTIONS[direction].key}`,
    click: () => {
      const window = BrowserWindow.getFocusedWindow();
      if (window) step(window.webContents, direction);
    },
  })),
};

export const watchHistory = (window: BrowserWindow) => {
  const { webContents } = window;
  const publish = () => {
    const availability: HistoryAvailability = {
      back: canStep(webContents, "back"),
      forward: canStep(webContents, "forward"),
    };
    webContents.send(Channel.history, availability);
    if (!window.isFocused()) return;
    const menu = Menu.getApplicationMenu();
    for (const direction of historyDirections) {
      const item = menu?.getMenuItemById(direction);
      if (item) item.enabled = availability[direction];
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
