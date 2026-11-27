import { join } from "node:path";
import { app, BrowserWindow, ipcMain, MessageChannelMain } from "electron";
import { Channel } from "../shared/channels.ts";
import { superviseHost } from "./host.ts";
import { serveShell } from "./shell.ts";
import { registerThumbnailScheme, serveThumbnails } from "./thumbnails.ts";
import { startUpdater } from "./updater.ts";
import { createWindow } from "./window.ts";

if (!app.isPackaged) app.setPath("userData", join(app.getAppPath(), ".data"));
registerThumbnailScheme();

const main = async () => {
  await app.whenReady();
  serveThumbnails();
  const host = superviseHost(() => {
    for (const window of BrowserWindow.getAllWindows()) window.webContents.reload();
  });

  ipcMain.on(Channel.connect, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || event.senderFrame !== event.sender.mainFrame) return;

    const toHost = new MessageChannelMain();
    host.connect({ actor: { _tag: "User" } }, toHost.port1);
    const toShell = new MessageChannelMain();
    serveShell(toShell.port1, window);
    event.sender.postMessage(Channel.ports, null, [toHost.port2, toShell.port2]);
  });

  createWindow();
  startUpdater();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
  app.on("will-quit", host.stop);
};

void main();
