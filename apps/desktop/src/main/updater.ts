import { app } from "electron";
import electronUpdater from "electron-updater";

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

export const startUpdater = () => {
  if (!app.isPackaged) return;
  const { autoUpdater } = electronUpdater;
  const check = () => autoUpdater.checkForUpdatesAndNotify().catch(() => null);
  void check();
  setInterval(() => void check(), CHECK_INTERVAL_MS);
};
