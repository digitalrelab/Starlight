import { BrowserWindow, Menu, type MenuItemConstructorOptions, type WebContents } from "electron";
import { Channel } from "#shared/channels.ts";
import {
  HISTORY_STEPS,
  type HistoryAvailability,
  type HistoryDirection,
  historyDirections,
} from "#shared/history.ts";

const canStep = ({ navigationHistory }: WebContents, direction: HistoryDirection) =>
  navigationHistory.canGoToOffset(HISTORY_STEPS[direction].offset);

const step = (webContents: WebContents, direction: HistoryDirection) => {
  if (canStep(webContents, direction)) {
    webContents.navigationHistory.goToOffset(HISTORY_STEPS[direction].offset);
  }
};

export const historyMenu: MenuItemConstructorOptions = {
  label: "Go",
  submenu: historyDirections.map((direction) => ({
    id: direction,
    label: HISTORY_STEPS[direction].label,
    accelerator: `CommandOrControl+${HISTORY_STEPS[direction].key}`,
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
  webContents.on("did-navigate-in-page", publish);
  webContents.ipc.on(Channel.historyRequest, publish);
  window.on("focus", publish);
  window.on("swipe", (_event, direction) => {
    if (direction === "left") step(webContents, "back");
    else if (direction === "right") step(webContents, "forward");
  });
};
